<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/common/AdminLayout.vue'
import { bookService, newBookStoreService } from '@/services'
import { useAuth } from '@/services/auth'
import { formatDate, getStatusLabel } from '@/utils'
import type { Book, NewBook } from '@/types'

const { user } = useAuth()
const books = ref<Book[]>([])
const saleBooks = ref<NewBook[]>([])
const isLoading = ref(true)
const searchFilter = ref('')
const destinationFilter = ref<'all' | 'library' | 'sale'>('all')
const isAddingBook = ref(false)

const newBook = ref({
  title: '',
  author: '',
  release_date: new Date().toISOString().split('T')[0] as string,
  edition: '',
  status: 'available' as 'available' | 'lent',
  destination: 'library' as 'library' | 'sale',
  credits_cost: 10,
  stock: 1,
  description: '',
  cover_url: '',
})

type AdminBookRow =
  | (Book & { rowType: 'library'; detailsLabel: string })
  | (NewBook & { rowType: 'sale'; status: 'available'; detailsLabel: string })

const loadBooks = async () => {
  try {
    isLoading.value = true
    const [libraryBooks, storeBooks] = await Promise.all([
      bookService.getAllBooks(),
      newBookStoreService.getNewBooks(),
    ])
    books.value = libraryBooks
    saleBooks.value = storeBooks
  } catch (error) {
    console.error('Erro ao carregar livros:', error)
  } finally {
    isLoading.value = false
  }
}

const filteredBooks = computed(() => {
  const merged: AdminBookRow[] = [
    ...books.value.map((book) => ({
      ...book,
      rowType: 'library' as const,
      detailsLabel: getStatusLabel(book.status),
    })),
    ...saleBooks.value.map((book) => ({
      ...book,
      rowType: 'sale' as const,
      status: 'available' as const,
      detailsLabel: `${book.credits_cost} créditos · ${book.stock} em estoque`,
    })),
  ]

  return merged.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(searchFilter.value.toLowerCase()) || 
                         b.author.toLowerCase().includes(searchFilter.value.toLowerCase())
    const matchesDestination = destinationFilter.value === 'all' || b.rowType === destinationFilter.value
    return matchesSearch && matchesDestination
  })
})

const handleAddBook = async () => {
  try {
    if (!user.value) return

    if (newBook.value.destination === 'sale') {
      await newBookStoreService.createCatalogItem(user.value.id, {
        title: newBook.value.title,
        author: newBook.value.author,
        release_date: newBook.value.release_date,
        edition: newBook.value.edition || undefined,
        description: newBook.value.description || undefined,
        cover_url: newBook.value.cover_url || undefined,
        credits_cost: newBook.value.credits_cost,
        stock: newBook.value.stock,
      })
    } else {
      await bookService.createBook({
        title: newBook.value.title,
        author: newBook.value.author,
        release_date: newBook.value.release_date,
        edition: newBook.value.edition || undefined,
        status: newBook.value.status,
        destination: 'library',
        created_at: new Date().toISOString(),
      })
    }

    isAddingBook.value = false
    newBook.value = {
      title: '',
      author: '',
      release_date: new Date().toISOString().split('T')[0] as string,
      edition: '',
      status: 'available',
      destination: 'library',
      credits_cost: 10,
      stock: 1,
      description: '',
      cover_url: '',
    }
    await loadBooks()
  } catch (error) {
    alert('Erro ao adicionar livro')
  }
}

onMounted(loadBooks)
</script>

<template>
  <AdminLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">Livros</h1>
        <p class="page-description">Gerencie o acervo de livros da biblioteca.</p>
      </div>
      <button @click="isAddingBook = true" class="btn">
        <span>+</span> Novo Livro
      </button>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <input 
        v-model="searchFilter" 
        type="text" 
        placeholder="Buscar por título ou autor..." 
        class="search-input"
      />
      <select v-model="destinationFilter" class="status-select">
        <option value="all">Todos os destinos</option>
        <option value="library">Biblioteca</option>
        <option value="sale">Venda</option>
      </select>
    </div>

    <div v-if="isLoading" class="loading-state">
      Carregando livros...
    </div>

    <div v-else class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Autor</th>
            <th>Edição</th>
            <th>Lançamento</th>
            <th>Destino</th>
            <th>Detalhes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="book in filteredBooks" :key="`${book.rowType}-${book.id}`">
            <td>
              <div class="book-cell">
                <span class="book-icon">📖</span>
                <span class="book-title">{{ book.title }}</span>
              </div>
            </td>
            <td>{{ book.author }}</td>
            <td>{{ book.edition || '-' }}</td>
            <td>{{ formatDate(book.release_date) }}</td>
            <td>
              <span class="badge" :class="book.rowType === 'sale' ? 'badge-green' : 'badge-gray'">
                {{ book.rowType === 'sale' ? 'Venda' : 'Biblioteca' }}
              </span>
            </td>
            <td>
              <span class="badge" :class="book.rowType === 'sale' || book.status === 'available' ? 'badge-green' : 'badge-red'">
                {{ book.detailsLabel }}
              </span>
            </td>
          </tr>
          <tr v-if="filteredBooks.length === 0">
            <td colspan="6" class="empty-table">Nenhum livro encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Adicionar Livro -->
    <div v-if="isAddingBook" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Adicionar Novo Livro</h2>
          <button @click="isAddingBook = false" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="handleAddBook" class="modal-form">
          <div class="form-group">
            <label>Título</label>
            <input v-model="newBook.title" type="text" required placeholder="Título do livro" />
          </div>
          <div class="form-group">
            <label>Autor</label>
            <input v-model="newBook.author" type="text" required placeholder="Nome do autor" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Data de Lançamento</label>
              <input v-model="newBook.release_date" type="date" required />
            </div>
            <div class="form-group">
              <label>Edição</label>
              <input v-model="newBook.edition" type="text" placeholder="Ex: 1ª Edição" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Destino</label>
              <select v-model="newBook.destination" required>
                <option value="library">Biblioteca</option>
                <option value="sale">Venda</option>
              </select>
            </div>
            <div v-if="newBook.destination === 'library'" class="form-group">
              <label>Status inicial</label>
              <select v-model="newBook.status" required>
                <option value="available">Disponível</option>
                <option value="lent">Emprestado</option>
              </select>
            </div>
            <div v-else class="form-group">
              <label>Custo em créditos</label>
              <input v-model.number="newBook.credits_cost" type="number" min="0" required />
            </div>
          </div>
          <div v-if="newBook.destination === 'sale'" class="form-row">
            <div class="form-group">
              <label>Estoque</label>
              <input v-model.number="newBook.stock" type="number" min="1" required />
            </div>
            <div class="form-group">
              <label>URL da capa</label>
              <input v-model="newBook.cover_url" type="url" placeholder="https://..." />
            </div>
          </div>
          <div v-if="newBook.destination === 'sale'" class="form-group">
            <label>Descrição</label>
            <input v-model="newBook.description" type="text" placeholder="Resumo ou observação para a vitrine" />
          </div>
          <div class="modal-actions">
            <button type="button" @click="isAddingBook = false" class="btn secondary">Cancelar</button>
            <button type="submit" class="btn">Salvar Livro</button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
}

.status-select {
  width: 200px;
}

.table-container {
  background: var(--white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
  overflow: hidden;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.admin-table th {
  background: var(--gray-50);
  padding: 1rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--gray-500);
  border-bottom: 1px solid var(--gray-200);
}

.admin-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--gray-100);
  font-size: 0.875rem;
  color: var(--gray-700);
}

.book-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.book-icon {
  font-size: 1.25rem;
}

.book-title {
  font-weight: 600;
  color: var(--gray-900);
}

.empty-table {
  text-align: center;
  padding: 3rem !important;
  color: var(--gray-500);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--white);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-100);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.25rem;
  color: var(--gray-900);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--gray-400);
  cursor: pointer;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
}

.loading-state {
  padding: 3rem;
  text-align: center;
  color: var(--gray-500);
}
</style>
