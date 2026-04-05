import { useState } from "react";
export function AdminUsers() {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem("users");
    return saved ? JSON.parse(saved) : [];
  });

  const [form, setForm] = useState({
    matricule: "",
    role: "AS",
    service: "",
  });

  const saveUsers = (newUsers) => {
    setUsers(newUsers);
    localStorage.setItem("users", JSON.stringify(newUsers));
  };

  const handleAdd = (e) => {
    e.preventDefault();

    if (!form.matricule) return;

    const newUsers = [...users, form];
    saveUsers(newUsers);

    setForm({ matricule: "", role: "AS", service: "" });
  };

  const handleDelete = (matricule) => {
    const newUsers = users.filter((u) => u.matricule !== matricule);
    saveUsers(newUsers);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Gestion des utilisateurs</h2>

      {/* FORMULAIRE */}
      <form onSubmit={handleAdd} style={{ marginBottom: 20 }}>
        <input
          placeholder="Matricule"
          value={form.matricule}
          onChange={(e) =>
            setForm({ ...form, matricule: e.target.value })
          }
        />

        <select
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
        >
          <option value="DIRECTION">Direction</option>
          <option value="CADRE">Cadre</option>
          <option value="AS">AS</option>
          <option value="IDE">IDE</option>
          <option value="MEDECIN">Médecin</option>
        </select>

        <input
          placeholder="Service"
          value={form.service}
          onChange={(e) =>
            setForm({ ...form, service: e.target.value })
          }
        />

        <button type="submit">Ajouter</button>
      </form>

      {/* LISTE */}
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Rôle</th>
            <th>Service</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.matricule}>
              <td>{u.matricule}</td>
              <td>{u.role}</td>
              <td>{u.service}</td>
              <td>
                <button onClick={() => handleDelete(u.matricule)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}