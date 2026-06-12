import database from "../repository/repo";

export const get_stats = () => {
  const userCount = database.query("SELECT COUNT(*) as count FROM users").get() as { count: number };
  const bookCount = database.query("SELECT COUNT(*) as count FROM books").get() as { count: number };
  const loanCount = database.query("SELECT COUNT(*) as count FROM loans").get() as { count: number };

  console.log(`Stats requested: Users=${userCount.count}, Books=${bookCount.count}, Loans=${loanCount.count}`);

  return Response.json({
    users: userCount.count,
    books: bookCount.count,
    loans: loanCount.count
  });
};
