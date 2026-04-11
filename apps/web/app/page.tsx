"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type User = {
  id: string;
  full_name: string;
};

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from("users")
        .select("*");

      if (data) setUsers(data);
    }

    fetchUsers();
  }, []);

  return (
    <div>
      <h1>Users</h1>
      {users.map((user) => (
        <p key={user.id}>{user.full_name}</p>
      ))}
    </div>
  );
}