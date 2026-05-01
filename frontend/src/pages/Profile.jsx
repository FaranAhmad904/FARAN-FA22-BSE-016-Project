import { useEffect, useState } from "react";
import api from "../api";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await api.get("/api/auth/profile");
        setUser(res.data);
      } catch (err) {
        setUser(null);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="p-4">
      <h2>Profile</h2>
      {user ? (
        <div>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
        </div>
      ) : (
        <p>Please login first.</p>
      )}
    </div>
  );
}

