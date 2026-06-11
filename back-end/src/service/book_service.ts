import {
  get_books,
  get_book_by_id,
  create_book,
} from "../repository/book_repo";
import { isBook } from "../utils";

export const list_books = () => Response.json(get_books());

export const find_book = (req: Request) => {
  const id = Number(req.url.split("/").pop());

  if (isNaN(id)) {
    return new Response(`Invalid ID`, { status: 400 });
  }

  const book = get_book_by_id(id);

  if (!book) {
    return new Response(`Book not found`, { status: 404 });
  }

  return Response.json(book);
};

export const create_new_book = async (req: Request) => {
  const body = await req.json();

  if (!isBook(body)) {
    return new Response(`Invalid book format`, { status: 400 });
  }

  const result = create_book(body);

  if (result.changes === 0) {
    return new Response(`Error while creating book`, { status: 500 });
  }

  return Response.json(
    { message: `Book created successfully`, success: true },
    { status: 201 },
  );
};
