import {
  create_user,
  get_users,
  get_user_by_id,
  get_user_by_credentials,
  update_password,
} from "../repository/user_repo";
import { isUser } from "../utils";

export const login_user = async (req: Request) => {
  const { email, password } = await req.json();

  if (typeof email !== "string" || typeof password !== "string") {
    return new Response(`Invalid credentials format`, { status: 400 });
  }

  const user = get_user_by_credentials(email, password);

  if (!user) {
    return new Response(`User not found`, { status: 404 });
  }

  return Response.json(user);
};

export const signin_user = async (req: Request) => {
  const body = await req.json();

  if (!isUser(body)) {
    return new Response(`Invalid user format`, { status: 400 });
  }

  const result = create_user(body);

  if (result.changes === 0) {
    return new Response(`Error while creating user`, { status: 500 });
  }

  return Response.json(
    { message: `User created successfully`, success: true },
    { status: 201 },
  );
};

export const list_users = () => Response.json(get_users());

export const find_user = (req: Request) => {
  const id = Number(req.url.split("/").pop());

  if (isNaN(id)) {
    return new Response(`Invalid ID`, { status: 400 });
  }

  const user = get_user_by_id(id);

  if (!user) {
    return new Response(`User not found`, { status: 404 });
  }

  return Response.json(user);
};

export const change_password = async (req: Request) => {
  const id = Number(req.url.split("/")[req.url.split("/").indexOf("users") + 1]);

  if (isNaN(id)) {
    return new Response(`Invalid ID`, { status: 400 });
  }

  const body = await req.json();
  const { current_password, new_password } = body;

  if (
    typeof current_password !== "string" ||
    typeof new_password !== "string" ||
    new_password.length < 6
  ) {
    return new Response(
      `Invalid payload — expected { current_password, new_password } with new_password >= 6 chars`,
      { status: 400 },
    );
  }

  const result = update_password(id, current_password, new_password);

  if (result.changes === 0) {
    return new Response(`Current password is incorrect`, { status: 401 });
  }

  return Response.json({ message: `Password updated successfully`, success: true });
};
