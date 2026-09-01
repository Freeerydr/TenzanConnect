// Builds a Base44-shaped entity wrapper around a single Supabase table.
// Mirrors the methods the app already calls: list, filter, get, create,
// bulkCreate, update, updateMany, bulkUpdate, delete, deleteMany, subscribe.
import { supabase } from "@/lib/supabaseClient";

function applySort(builder, sort) {
  if (!sort) return builder;
  for (const part of String(sort).split(",")) {
    const s = part.trim();
    if (!s) continue;
    if (s.startsWith("-")) builder = builder.order(s.slice(1), { ascending: false });
    else builder = builder.order(s, { ascending: true });
  }
  return builder;
}

function opToString(key, op, val) {
  switch (op) {
    case "$eq": return `${key}.eq.${val}`;
    case "$ne": return `${key}.neq.${val}`;
    case "$gt": return `${key}.gt.${val}`;
    case "$gte": return `${key}.gte.${val}`;
    case "$lt": return `${key}.lt.${val}`;
    case "$lte": return `${key}.lte.${val}`;
    case "$in": return `${key}.in.(${(val || []).join(",")})`;
    case "$nin": return `${key}.not.in.(${(val || []).join(",")})`;
    case "$exists": return val ? `${key}.not.is.null` : `${key}.is.null`;
    default: return `${key}.eq.${val}`;
  }
}

function branchToString(branch) {
  const conds = [];
  for (const [key, value] of Object.entries(branch)) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      for (const [op, opVal] of Object.entries(value)) conds.push(opToString(key, op, opVal));
    } else {
      conds.push(`${key}.eq.${value}`);
    }
  }
  return conds.length === 1 ? conds[0] : `and(${conds.join(",")})`;
}

function applyOp(builder, key, op, val) {
  switch (op) {
    case "$eq": return builder.eq(key, val);
    case "$ne": return builder.neq(key, val);
    case "$gt": return builder.gt(key, val);
    case "$gte": return builder.gte(key, val);
    case "$lt": return builder.lt(key, val);
    case "$lte": return builder.lte(key, val);
    case "$in": return builder.in(key, val);
    case "$nin": return builder.not(key, "in", val);
    case "$exists": return val ? builder.not(key, "is", null) : builder.is(key, null);
    default: return builder.eq(key, val);
  }
}

function applyFilter(query, builder) {
  for (const [key, value] of Object.entries(query || {})) {
    if (key === "$or") {
      const str = (value || []).map(branchToString).join(",");
      if (str) builder = builder.or(str);
      continue;
    }
    if (key === "$and") {
      for (const sub of value || []) builder = applyFilter(sub, builder);
      continue;
    }
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      for (const [op, opVal] of Object.entries(value)) builder = applyOp(builder, key, op, opVal);
    } else if (value === null || value === undefined) {
      builder = builder.is(key, null);
    } else {
      builder = builder.eq(key, value);
    }
  }
  return builder;
}

export function createEntity(table) {
  return {
    async list(sort, limit) {
      let q = supabase.from(table).select("*");
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    async filter(query, sort, limit) {
      let q = supabase.from(table).select("*");
      q = applyFilter(query, q);
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    async get(id) {
      const { data, error } = await supabase.from(table).select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    async create(data) {
      const { data: row, error } = await supabase.from(table).insert(data).select().single();
      if (error) throw error;
      return row;
    },
    async bulkCreate(items) {
      const { data, error } = await supabase.from(table).insert(items).select();
      if (error) throw error;
      return data || [];
    },
    async update(id, data) {
      const { data: row, error } = await supabase.from(table).update(data).eq("id", id).select().single();
      if (error) throw error;
      return row;
    },
    async updateMany(query, updateOps) {
      const setData = updateOps && updateOps.$set ? updateOps.$set : updateOps;
      let q = supabase.from(table).update(setData);
      q = applyFilter(query, q);
      const { error } = await q;
      if (error) throw error;
    },
    async bulkUpdate(items) {
      const { data, error } = await supabase.from(table).upsert(items, { onConflict: "id" }).select();
      if (error) throw error;
      return data || [];
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    async deleteMany(query) {
      let q = supabase.from(table).delete();
      q = applyFilter(query, q);
      const { error } = await q;
      if (error) throw error;
    },
    subscribe(callback) {
      const channel = supabase
        .channel(`${table}-changes`)
        .on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
          const type = payload.eventType === "INSERT" ? "create" : payload.eventType === "UPDATE" ? "update" : "delete";
          callback({ id: payload.new?.id || payload.old?.id, type, data: payload.new || payload.old });
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    },
    schema() {
      return { type: "object", properties: {} };
    },
  };
}

// User entity maps to the user_roles table, exposing `id` as the auth user id.
export function createUserEntity() {
  const cols = "user_id as id, role, full_name, email, created_date";
  return {
    async list(sort, limit) {
      let q = supabase.from("user_roles").select(cols);
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    async filter(query, sort, limit) {
      let q = supabase.from("user_roles").select(cols);
      q = applyFilter(query, q);
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    async get(id) {
      const { data, error } = await supabase.from("user_roles").select(cols).eq("user_id", id).single();
      if (error) throw error;
      return data;
    },
    async update(id, data) {
      const { data: row, error } = await supabase.from("user_roles").update(data).eq("user_id", id).select(cols).single();
      if (error) throw error;
      return row;
    },
    async create() { throw new Error("User records cannot be created directly; invite users instead."); },
    async delete() { throw new Error("User deletion is not supported from the client."); },
  };
}