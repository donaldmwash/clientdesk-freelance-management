"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Activity, ArrowDownRight, ArrowUpRight, Bell, BriefcaseBusiness, CalendarDays, ChevronDown, CircleHelp, CreditCard, FileText, LayoutDashboard, Menu, Plus, Search, Settings, Users, Wallet, X } from "lucide-react";

type Client = { id: string; name: string; company: string; email: string; initials: string; tone: string };
type Invoice = { id: string; dbId?: string; client: string; amount: number; due: string; status: "Paid" | "Pending" | "Overdue" };
type Expense = { id: string; label: string; category: string; date: string; amount: number };
type ClientRow = { id: string; name: string; company: string | null; email: string | null };
type InvoiceRow = { id: string; invoice_number: string; client_id: string | null; due_date: string; status: string; total: number | string };
type ExpenseRow = { id: string; description: string; category: string; expense_date: string; amount: number | string };

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

function Status({ value }: { value: Invoice["status"] }) {
  const styles = value === "Paid" ? "bg-emerald-50 text-emerald-700" : value === "Overdue" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{value}</span>;
}

export default function DashboardClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [tab, setTab] = useState("Overview");
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"client" | "invoice" | "expense" | null>(null);
  const [notice, setNotice] = useState("Demo records · Database connection ready");
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [amount, setAmount] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadWorkspace() {
      const supabase = createSupabaseBrowserClient();
      const [clientResult, invoiceResult, expenseResult] = await Promise.all([
        supabase.from("clients").select("id,name,company,email").order("created_at", { ascending: false }),
        supabase.from("invoices").select("id,invoice_number,client_id,due_date,status,total").order("created_at", { ascending: false }),
        supabase.from("expenses").select("id,description,category,expense_date,amount").order("expense_date", { ascending: false })
      ]);
      if (!active) return;
      if (clientResult.error || invoiceResult.error || expenseResult.error) {
        setNotice("We couldn't load your records. Check that the ClientDesk database schema has been applied.");
        return;
      }
      const clientRows = (clientResult.data ?? []) as ClientRow[];
      const invoiceRows = (invoiceResult.data ?? []) as InvoiceRow[];
      const expenseRows = (expenseResult.data ?? []) as ExpenseRow[];
      const clientMap = new Map<string, ClientRow>(clientRows.map(client => [client.id, client]));
      setClients(clientRows.map(client => ({
        id: client.id, name: client.name, company: client.company ?? "Independent",
        email: client.email ?? "", initials: client.name.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(),
        tone: "bg-teal-100 text-teal-800"
      })));
      setInvoices(invoiceRows.map(invoice => ({
        id: invoice.invoice_number, dbId: invoice.id,
        client: clientMap.get(invoice.client_id)?.company || clientMap.get(invoice.client_id)?.name || "Unassigned client",
        amount: Number(invoice.total), due: new Date(invoice.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        status: invoice.status === "paid" ? "Paid" : invoice.status === "overdue" ? "Overdue" : "Pending"
      })));
      setExpenses(expenseRows.map(expense => ({
        id: expense.id, label: expense.description, category: expense.category,
        date: new Date(expense.expense_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
        amount: Number(expense.amount)
      })));
      setNotice("Connected to your private ClientDesk workspace · Changes save to Supabase");
    }
    loadWorkspace().catch(() => setNotice("Unable to connect to your workspace. Please refresh and try again."));
    return () => { active = false; };
  }, []);

  const paid = invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0);
  const outstanding = invoices.filter(i => i.status !== "Paid").reduce((sum, i) => sum + i.amount, 0);
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const filteredClients = useMemo(() => clients.filter(c => (c.name + c.company + c.email).toLowerCase().includes(search.toLowerCase())), [clients, search]);

  async function saveRecord() {
    if (!name.trim()) return;
    const supabase = createSupabaseBrowserClient();
    setNotice("Saving record…");
    if (modal === "client") {
      const { data, error } = await supabase.from("clients").insert({ name: name.trim(), company: detail.trim() || null }).select("id,name,company,email").single();
      if (error) { setNotice(error.message); return; }
      setClients(prev => [{ id: data.id, name: data.name, company: data.company ?? "Independent", email: data.email ?? "", initials: data.name.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(), tone: "bg-teal-100 text-teal-800" }, ...prev]);
    } else if (modal === "invoice") {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) return;
      const { data: client, error: clientError } = await supabase.from("clients").select("id,name,company").or(`name.ilike.${name.trim()},company.ilike.${name.trim()}`).limit(1).maybeSingle();
      if (clientError || !client) { setNotice("Add this client first, then create the invoice using the client's exact name or company."); return; }
      const dueDate = detail ? new Date(detail).toISOString().slice(0, 10) : new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase.from("invoices").insert({
        client_id: client.id, invoice_number: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        due_date: dueDate, status: "sent", subtotal: value, tax: 0
      }).select("id,invoice_number,total,due_date,status").single();
      if (error) { setNotice(error.message); return; }
      setInvoices(prev => [{ id: data.invoice_number, dbId: data.id, client: client.company || client.name, amount: Number(data.total), due: new Date(data.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }), status: "Pending" }, ...prev]);
    } else if (modal === "expense") {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) return;
      const { data, error } = await supabase.from("expenses").insert({ description: name.trim(), category: detail.trim() || "General", amount: value }).select("id,description,category,expense_date,amount").single();
      if (error) { setNotice(error.message); return; }
      setExpenses(prev => [{ id: data.id, label: data.description, category: data.category, date: "Today", amount: Number(data.amount) }, ...prev]);
    }
    setNotice("Saved successfully to your Supabase database");
    setModal(null); setName(""); setDetail(""); setAmount("");
  }

  const nav = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Clients", icon: Users },
    { label: "Invoices", icon: FileText },
    { label: "Expenses", icon: Wallet }
  ];

  return (
    <div className="min-h-screen lg:flex">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-line bg-white px-5 py-6 transition-transform lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-10 flex items-center justify-between px-2">
          <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white"><BriefcaseBusiness size={19}/></div><span className="text-xl font-bold tracking-tight">clientdesk<span className="text-brand">.</span></span></div>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20}/></button>
        </div>
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Workspace</p>
        <nav className="space-y-1">{nav.map(item => <button key={item.label} onClick={() => { setTab(item.label); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${tab === item.label ? "bg-emerald-50 text-brand" : "text-slate-500 hover:bg-slate-50 hover:text-ink"}`}><item.icon size={18}/>{item.label}{item.label === "Invoices" && <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">{invoices.length}</span>}</button>)}</nav>
        <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Preferences</p>
        <button onClick={() => setNotice("Settings will be available with account setup")} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50"><Settings size={18}/>Settings</button>
        <button onClick={() => setNotice("Help centre coming soon")} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50"><CircleHelp size={18}/>Help centre</button>
        <div className="mt-auto rounded-2xl bg-[#f4f7f3] p-4"><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand"><Activity size={15}/>Your business, in focus</div><p className="text-xs leading-5 text-slate-500">A calmer way to keep clients, cash flow and work organised.</p></div>
        <div className="mt-5 flex items-center gap-3 border-t border-line pt-5"><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">DM</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{userEmail}</p><p className="text-xs text-slate-400">Your workspace</p></div><button onClick={async () => { await createSupabaseBrowserClient().auth.signOut(); router.replace("/login"); router.refresh(); }} className="ml-auto text-xs font-semibold text-slate-500 hover:text-rose-600">Sign out</button></div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex h-[76px] items-center justify-between border-b border-line bg-white px-5 sm:px-8">
          <div className="flex items-center gap-3"><button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu/></button><div><p className="text-xs text-slate-400">Workspace / {tab}</p><p className="text-sm font-semibold">{tab === "Overview" ? "Business overview" : tab}</p></div></div>
          <div className="flex items-center gap-3"><span className="hidden text-xs text-slate-400 sm:block">Tuesday, November 10, 2026</span><button onClick={() => setNotice("You're all caught up")} className="relative rounded-xl border border-line p-2.5 text-slate-500"><Bell size={17}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand"/></button><div className="hidden h-8 w-px bg-line sm:block"/><div className="hidden items-center gap-2 sm:flex"><div className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-[10px] font-bold text-white">DM</div><span className="text-sm font-semibold">My business</span><ChevronDown size={14} className="text-slate-400"/></div></div>
        </header>
        <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand"/><span className="text-xs font-semibold uppercase tracking-[.15em] text-brand">Tuesday, 10 November 2026</span></div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Good morning. Let’s get things done.</h1><p className="mt-2 text-sm text-muted">Here’s what’s happening with your business today.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setModal("expense")} className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"><Plus size={16}/>Add expense</button><button onClick={() => setModal("invoice")} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d5946]"><Plus size={16}/>Create invoice</button></div></div>
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">{notice}</div>
          {tab === "Overview" && <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Collected revenue", value: money(paid), change: "+12.8%", icon: ArrowUpRight, note: "from paid invoices" },
                { label: "Outstanding", value: money(outstanding), change: "2 invoices", icon: CreditCard, note: "awaiting payment" },
                { label: "Business expenses", value: money(spent), change: "This month", icon: ArrowDownRight, note: "recorded expenses" },
                { label: "Net cash position", value: money(paid - spent), change: "Revenue less costs", icon: Activity, note: "based on demo records" }
              ].map((stat, i) => <div key={stat.label} className="rounded-2xl border border-line bg-white p-5 shadow-soft"><div className="mb-5 flex items-center justify-between"><span className="text-sm text-muted">{stat.label}</span><span className="rounded-xl bg-[#f3f7f3] p-2 text-brand"><stat.icon size={17}/></span></div><p className="text-2xl font-bold tracking-tight">{stat.value}</p><div className="mt-3 flex items-center gap-2 text-xs"><span className={i === 1 ? "text-amber-700" : "text-brand"}>{stat.change}</span><span className="text-slate-400">{stat.note}</span></div></div>)}
            </div>
            <div className="mt-6 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
              <section className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-bold">Recent invoices</h2><p className="mt-1 text-xs text-muted">Keep an eye on incoming payments</p></div><button onClick={() => setTab("Invoices")} className="text-xs font-semibold text-brand">View all →</button></div><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b border-line text-xs text-slate-400"><th className="pb-3 font-medium">Invoice</th><th className="pb-3 font-medium">Client</th><th className="pb-3 font-medium">Due date</th><th className="pb-3 font-medium">Amount</th><th className="pb-3 font-medium">Status</th></tr></thead><tbody>{invoices.slice(0, 4).map(inv => <tr key={inv.id} className="border-b border-[#f0f2ef] last:border-0"><td className="py-4 font-semibold">{inv.id}</td><td className="py-4 text-slate-500">{inv.client}</td><td className="py-4 text-slate-500">{inv.due}</td><td className="py-4 font-semibold">{money(inv.amount)}</td><td className="py-4"><Status value={inv.status}/></td></tr>)}</tbody></table></div></section>
              <section className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">Recent expenses</h2><p className="mt-1 text-xs text-muted">Where your money goes</p></div><button onClick={() => setTab("Expenses")} className="text-xs font-semibold text-brand">View all →</button></div>{expenses.slice(0, 4).map(exp => <div key={exp.id} className="flex items-center gap-3 border-b border-[#f0f2ef] py-3 last:border-0"><div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-slate-500"><Wallet size={16}/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{exp.label}</p><p className="text-xs text-slate-400">{exp.category} · {exp.date}</p></div><p className="text-sm font-semibold">{money(exp.amount)}</p></div>)}</section>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-line bg-white p-5 shadow-soft"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Your clients</h2><button onClick={() => setTab("Clients")} className="text-xs font-semibold text-brand">Manage clients →</button></div><div className="grid grid-cols-2 gap-3">{clients.slice(0, 4).map(c => <div key={c.id} className="flex items-center gap-3 rounded-xl bg-[#f8faf7] p-3"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${c.tone}`}>{c.initials}</div><div className="min-w-0"><p className="truncate text-xs font-semibold">{c.name}</p><p className="truncate text-[11px] text-slate-400">{c.company}</p></div></div>)}</div></section><section className="rounded-2xl bg-[#1f4e3d] p-5 text-white shadow-soft"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-emerald-200">A little reminder</p><h2 className="mt-3 max-w-xs text-xl font-bold leading-7">Good business starts with clear numbers.</h2><p className="mt-2 max-w-sm text-sm leading-6 text-emerald-100/80">Keep your invoices current and your expenses organised. You’ll thank yourself at month end.</p></div><CalendarDays className="text-emerald-200" size={24}/></div></section></div>
          </>}
          {tab === "Clients" && <section className="rounded-2xl border border-line bg-white p-5 shadow-soft"><div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-bold">Client directory</h2><p className="mt-1 text-xs text-muted">{clients.length} clients in your workspace</p></div><div className="flex gap-2"><div className="flex items-center gap-2 rounded-xl border border-line px-3"><Search size={15} className="text-slate-400"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients" className="w-36 py-2 text-sm outline-none"/></div><button onClick={() => setModal("client")} className="flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white"><Plus size={15}/>Add client</button></div></div>{filteredClients.map(c => <div key={c.id} className="flex items-center gap-3 border-t border-line py-4"><div className={`grid h-10 w-10 place-items-center rounded-full text-xs font-bold ${c.tone}`}>{c.initials}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{c.name}</p><p className="text-xs text-slate-400">{c.company} · {c.email}</p></div><button onClick={() => setNotice(`Selected ${c.name}`)} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold">View</button></div>)}</section>}
          {tab === "Invoices" && <section className="rounded-2xl border border-line bg-white p-5 shadow-soft"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">Invoice register</h2><p className="mt-1 text-xs text-muted">{invoices.length} invoices · {money(outstanding)} outstanding</p></div><button onClick={() => setModal("invoice")} className="flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white"><Plus size={15}/>New invoice</button></div>{invoices.map(inv => <div key={inv.id} className="flex flex-wrap items-center gap-3 border-t border-line py-4"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{inv.id}</p><p className="mt-1 text-xs text-slate-400">{inv.client} · Due {inv.due}</p></div><p className="mr-2 text-sm font-bold">{money(inv.amount)}</p><Status value={inv.status}/>{inv.status !== "Paid" && <button onClick={async () => { if (!inv.dbId) return; const { error } = await createSupabaseBrowserClient().from("invoices").update({ status: "paid" }).eq("id", inv.dbId); if (error) { setNotice(error.message); return; } setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: "Paid" } : i)); setNotice("Invoice marked as paid and saved"); }} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:bg-slate-50">Mark paid</button>}</div>)}</section>}
          {tab === "Expenses" && <section className="rounded-2xl border border-line bg-white p-5 shadow-soft"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">Expense register</h2><p className="mt-1 text-xs text-muted">{expenses.length} expenses · {money(spent)} recorded</p></div><button onClick={() => setModal("expense")} className="flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white"><Plus size={15}/>Add expense</button></div>{expenses.map(exp => <div key={exp.id} className="flex items-center gap-3 border-t border-line py-4"><div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-slate-500"><Wallet size={16}/></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{exp.label}</p><p className="text-xs text-slate-400">{exp.category} · {exp.date}</p></div><p className="text-sm font-bold">{money(exp.amount)}</p></div>)}</section>}
          <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-line pt-5 text-xs text-slate-400 sm:flex-row"><span>© 2026 ClientDesk. Built for independent businesses.</span><span>Clear records. Better decisions.</span></footer>
        </div>
      </main>
      {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">{modal === "client" ? "Add a client" : modal === "invoice" ? "Create an invoice" : "Add an expense"}</h2><p className="mt-1 text-xs text-muted">This record will be saved to your account</p></div><button onClick={() => setModal(null)} aria-label="Close" className="rounded-lg p-2 hover:bg-slate-100"><X size={18}/></button></div><form onSubmit={e => { e.preventDefault(); saveRecord(); }} className="space-y-4"><label className="block text-xs font-semibold text-slate-600">{modal === "client" ? "Client name" : modal === "invoice" ? "Client / project" : "Expense name"}<input required value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-line px-3 py-3 text-sm outline-none focus:border-brand" placeholder={modal === "client" ? "e.g. Alex Morgan" : modal === "invoice" ? "e.g. Website redesign" : "e.g. Hosting subscription"}/></label>{modal !== "invoice" && <label className="block text-xs font-semibold text-slate-600">{modal === "client" ? "Company" : "Category"}<input value={detail} onChange={e => setDetail(e.target.value)} className="mt-2 w-full rounded-xl border border-line px-3 py-3 text-sm outline-none focus:border-brand" placeholder={modal === "client" ? "Company name" : "Software, travel, office..."}/></label>}{modal !== "client" && <><label className="block text-xs font-semibold text-slate-600">Amount (USD)<input required min="0.01" step="0.01" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="mt-2 w-full rounded-xl border border-line px-3 py-3 text-sm outline-none focus:border-brand" placeholder="0.00"/></label>{modal === "invoice" && <label className="block text-xs font-semibold text-slate-600">Due date<input value={detail} onChange={e => setDetail(e.target.value)} className="mt-2 w-full rounded-xl border border-line px-3 py-3 text-sm outline-none focus:border-brand" placeholder="e.g. Nov 25, 2026"/></label>}</>}<div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModal(null)} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold">Cancel</button><button className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">Save record</button></div></form></div></div>}
    </div>
  );
}
