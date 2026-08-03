import React from "react";
import { getUsers } from "@/app/admin/actions";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
    const users = await getUsers();

    return <UsersClient initialUsers={users as any} />;
}
