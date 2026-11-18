// ─── Mock Supabase untuk Mode Demo ──────────────────────────────────────────
// Dipakai HANYA saat VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY tidak diset
// (lihat supabaseClient.js). Meniru permukaan API @supabase/supabase-js
// yang dipakai aplikasi ini — auth + from().select/eq/order/insert/update/
// delete/maybeSingle/single — dengan data tersimpan di localStorage
// (melalui lapisan demo.js). Bukan pengganti Supabase; saat env diset,
// client asli yang dipakai dan file ini tidak pernah diimpor jalurnya.

import { getDemoState, updateDemoState } from "./demo";

const AUTH_KEY = "syncnol-demo-auth-v1";

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* abaikan */
  }
  return { users: [], session: null };
}

function saveAuth(auth) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } catch {
    /* abaikan */
  }
}

const listeners = new Set();

function emit(event, session) {
  listeners.forEach((fn) => {
    try {
      fn(event, session);
    } catch {
      /* abaikan */
    }
  });
}

function toSession(user) {
  if (!user) return null;
  return {
    access_token: "demo-token",
    user: { id: user.id, email: user.email },
  };
}

export const demoAuth = {
  async getSession() {
    const { session } = loadAuth();
    return { data: { session: toSession(session) }, error: null };
  },

  async signInWithPassword({ email, password }) {
    const auth = loadAuth();
    const user = auth.users.find(
      (u) => u.email.toLowerCase() === String(email).toLowerCase(),
    );
    if (!user || user.password !== password) {
      return {
        data: {},
        error: {
          message:
            "Email atau kata sandi salah. Mode demo: buat akun dulu lewat Sign Up (akun hanya tersimpan di browser ini).",
        },
      };
    }
    auth.session = { id: user.id, email: user.email };
    saveAuth(auth);
    const session = toSession(auth.session);
    emit("SIGNED_IN", session);
    return { data: { session, user: session.user }, error: null };
  },

  async signUp({ email, password }) {
    const auth = loadAuth();
    const exists = auth.users.some(
      (u) => u.email.toLowerCase() === String(email).toLowerCase(),
    );
    if (exists) {
      return {
        data: {},
        error: { message: "Akun demo dengan email itu sudah ada. Silakan Sign In." },
      };
    }
    if (String(password || "").length < 6) {
      return {
        data: {},
        error: { message: "Kata sandi minimal 6 karakter." },
      };
    }
    const user = { id: `demo-${Date.now()}`, email, password };
    auth.users.push(user);
    saveAuth(auth);
    // Mode demo tidak mengirim email konfirmasi — AuthPage mengarahkan
    // pengguna kembali ke Sign In seperti alur Supabase.
    return { data: { user: { id: user.id, email: user.email } }, error: null };
  },

  async signOut() {
    const auth = loadAuth();
    auth.session = null;
    saveAuth(auth);
    emit("SIGNED_OUT", null);
    return { error: null };
  },

  onAuthStateChange(fn) {
    listeners.add(fn);
    return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } };
  },
};

// ─── Query builder (thenable) ───────────────────────────────────────────────

function tableRows(table) {
  const state = getDemoState();
  if (table === "goals") return state.goals;
  if (table === "academy_progress") {
    return state.academy.map((module_id, i) => ({
      id: `ap-${i}`,
      user_id: 1,
      module_id,
    }));
  }
  return [];
}

function writeTable(table, rows) {
  updateDemoState((s) => {
    if (table === "goals") s.goals = rows;
    if (table === "academy_progress") {
      s.academy = rows.map((r) => r.module_id);
    }
  });
}

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orderBy = null;
    this.columns = "*";
    this.op = "select";
    this.payload = null;
    this.inserted = null;
  }

  select(columns = "*") {
    this.columns = columns;
    return this;
  }

  eq(col, val) {
    this.filters.push((row) => String(row[col]) === String(val));
    return this;
  }

  order(col, { ascending = true } = {}) {
    this.orderBy = { col, ascending };
    return this;
  }

  insert(rows) {
    this.op = "insert";
    const list = Array.isArray(rows) ? rows : [rows];
    const now = new Date().toISOString();
    this.inserted = list.map((r) => ({
      id: `${this.table}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      created_at: now,
      ...r,
    }));
    const current = tableRows(this.table);
    // Hindari duplikat academy_progress (user_id + module_id unik)
    if (this.table === "academy_progress") {
      const fresh = this.inserted.filter(
        (r) => !current.some((c) => c.user_id === r.user_id && c.module_id === r.module_id),
      );
      writeTable(this.table, [...current, ...fresh]);
      this.inserted = fresh;
    } else {
      writeTable(this.table, [...current, ...this.inserted]);
    }
    return this;
  }

  update(patch) {
    this.op = "update";
    this.payload = patch;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  execute() {
    let rows = tableRows(this.table);
    if (this.op === "update") {
      const targets = rows.filter((r) => this.filters.every((f) => f(r)));
      const updated = targets.map((r) => ({ ...r, ...this.payload }));
      const map = new Map(updated.map((r) => [r.id, r]));
      writeTable(
        this.table,
        rows.map((r) => map.get(r.id) || r),
      );
      return { data: updated, error: null };
    }
    if (this.op === "delete") {
      const kept = rows.filter((r) => !this.filters.every((f) => f(r)));
      writeTable(this.table, kept);
      return { data: null, error: null };
    }
    // select / insert
    let data = this.op === "insert" ? this.inserted || [] : rows;
    if (this.op === "select") {
      data = data.filter((r) => this.filters.every((f) => f(r)));
      if (this.orderBy) {
        const { col, ascending } = this.orderBy;
        data = [...data].sort((a, b) => {
          if (a[col] < b[col]) return ascending ? -1 : 1;
          if (a[col] > b[col]) return ascending ? 1 : -1;
          return 0;
        });
      }
      if (this.columns !== "*") {
        const cols = this.columns.split(",").map((c) => c.trim());
        data = data.map((r) => {
          const out = {};
          cols.forEach((c) => {
            out[c] = r[c];
          });
          return out;
        });
      }
    }
    return { data, error: null };
  }

  async maybeSingle() {
    const { data } = this.execute();
    return { data: data && data.length ? data[0] : null, error: null };
  }

  async single() {
    const { data } = this.execute();
    if (!data || !data.length) {
      return { data: null, error: { message: "No rows found" } };
    }
    return { data: data[0], error: null };
  }

  then(resolve, reject) {
    try {
      resolve(this.execute());
    } catch (e) {
      reject(e);
    }
  }
}

export const demoSupabase = {
  auth: demoAuth,
  from: (table) => new QueryBuilder(table),
};
