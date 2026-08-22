import { useState } from "react";
import { Blueprint, PageHead, Plate } from "../components/blueprint";
import { Loading, Spinner } from "../components/layout";
import { StatStrip } from "../components/figures";
import {
  useAdminLeads,
  useAdminOverview,
  useAdminProperties,
  useAdminUsers,
  useAdminZips,
  useDeleteLead,
  useDeleteProperty,
  useDeleteZip,
  useGrantRole,
  useUpsertLead,
  useUpsertProperty,
  useUpsertZip,
} from "../queries/admin";
import { num } from "../lib/format";

type Tab = "properties" | "zips" | "leads" | "users";
const TABS: { key: Tab; label: string }[] = [
  { key: "properties", label: "Listings" },
  { key: "zips", label: "ZIPs" },
  { key: "leads", label: "Leads" },
  { key: "users", label: "Users" },
];

/** Editable numeric/text cell — commits on blur, never on every keystroke. */
function Cell({
  value,
  onCommit,
  numeric = false,
  width,
  label = "Value",
}: {
  value: string | number;
  onCommit: (next: string) => void;
  numeric?: boolean;
  width?: number;
  label?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const shown = focused ? draft : String(value);
  return (
    <input
      aria-label={label}
      className="input"
      style={{ width, padding: "4px 7px", fontSize: 13, height: 28 }}
      inputMode={numeric ? "numeric" : undefined}
      value={shown}
      onFocus={() => {
        setDraft(String(value));
        setFocused(true);
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setFocused(false);
        if (draft !== String(value)) onCommit(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("properties");
  const overview = useAdminOverview();

  if (overview.isLoading) return <Loading label="CHECKING CLEARANCE" />;

  if (overview.isError) {
    return (
      <div className="pp-rise">
        <PageHead kicker="PP-13 · DATA EDITOR" title="Restricted" />
        <Blueprint style={{ padding: 28, maxWidth: 560 }}>
          <div className="micro" style={{ color: "var(--accent-ink)", marginBottom: 10 }}>
            403 — NO ADMIN ROLE ON THIS ACCOUNT
          </div>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            The data spine is admin-only. Ask an existing admin to grant your account the admin role, then reload
            this page.
          </p>
        </Blueprint>
      </div>
    );
  }

  const o = overview.data;

  return (
    <div className="pp-rise">
      <PageHead
        kicker="PP-13 · DATA EDITOR"
        title="The market spine"
        sub="Every score on this platform is computed from these rows. Edit them and the whole product moves with you."
        right="ADMIN ONLY · CHANGES ARE LIVE"
      />

      {o ? (
        <div style={{ marginBottom: 26 }}>
          <StatStrip
            columns={4}
            items={[
              { label: "LISTINGS", value: num(o.properties) },
              { label: "ZIPS", value: num(o.zips) },
              { label: "LEADS", value: `${num(o.leads)} / ${num(o.purchases)} SOLD` },
              { label: "USERS", value: num(o.users) },
            ]}
          />
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--color-divider)",
          marginBottom: 24,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className="micro"
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 18px",
              border: 0,
              cursor: "pointer",
              background: tab === t.key ? "var(--color-accent-700)" : "transparent",
              color: tab === t.key ? "var(--plate-ink-text)" : "var(--color-muted)",
            }}
          >
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "properties" ? <PropertiesTab /> : null}
      {tab === "zips" ? <ZipsTab /> : null}
      {tab === "leads" ? <LeadsTab /> : null}
      {tab === "users" ? <UsersTab /> : null}
    </div>
  );
}

function PropertiesTab() {
  const rows = useAdminProperties();
  const upsert = useUpsertProperty();
  const remove = useDeleteProperty();

  if (rows.isLoading) return <Loading label="LOADING LISTINGS" />;

  return (
    <Plate label="LISTINGS" right={`${num(rows.data?.length ?? 0)} ROWS · EDIT AND TAB OUT TO SAVE`} bodyStyle={{ padding: 0 }}>
      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Address</th>
              <th>City</th>
              <th>ZIP</th>
              <th>Price</th>
              <th>Score</th>
              <th>Rent</th>
              <th>DOM</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {(rows.data ?? []).map((p) => (
              <tr key={p.id}>
                <td className="micro text-muted">{p.id}</td>
                <td>
                  <Cell label="addr" value={p.addr} width={210} onCommit={(v) => upsert.mutate({ ...p, addr: v })} />
                </td>
                <td>
                  <Cell label="city" value={p.city} width={120} onCommit={(v) => upsert.mutate({ ...p, city: v })} />
                </td>
                <td>
                  <Cell label="zip" value={p.zip} width={70} onCommit={(v) => upsert.mutate({ ...p, zip: v })} />
                </td>
                <td>
                  <Cell
                    label="price"
                    numeric
                    value={p.price}
                    width={90}
                    onCommit={(v) => upsert.mutate({ ...p, price: Number(v) || 0 })}
                  />
                </td>
                <td>
                  <Cell
                    label="score"
                    numeric
                    value={p.score}
                    width={56}
                    onCommit={(v) => upsert.mutate({ ...p, score: Number(v) || 0 })}
                  />
                </td>
                <td>
                  <Cell
                    label="rent"
                    numeric
                    value={p.rent}
                    width={74}
                    onCommit={(v) => upsert.mutate({ ...p, rent: Number(v) || 0 })}
                  />
                </td>
                <td>
                  <Cell
                    label="dom"
                    numeric
                    value={p.dom}
                    width={56}
                    onCommit={(v) => upsert.mutate({ ...p, dom: Number(v) || 0 })}
                  />
                </td>
                <td style={{ textAlign: "right" }}>
                  <button
                    type="button"
                    className="btn btn-ghost micro"
                    style={{ padding: 0 }}
                    disabled={remove.isPending}
                    onClick={() => remove.mutate({ id: p.id })}
                  >
                    DELETE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Plate>
  );
}

function ZipsTab() {
  const rows = useAdminZips();
  const upsert = useUpsertZip();
  const remove = useDeleteZip();

  if (rows.isLoading) return <Loading label="LOADING ZIPS" />;

  return (
    <Plate label="ZIP SPINE" right={`${num(rows.data?.length ?? 0)} REGIONS`} bodyStyle={{ padding: 0 }}>
      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 980 }}>
          <thead>
            <tr>
              <th>ZIP</th>
              <th>Name</th>
              <th>County</th>
              <th>Avg price</th>
              <th>Emerging</th>
              <th>Velocity</th>
              <th>Permits</th>
              <th>Inv. mo.</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {(rows.data ?? []).map((z) => (
              <tr key={z.zip}>
                <td className="micro" style={{ color: "var(--accent-ink)" }}>
                  {z.zip}
                </td>
                <td>
                  <Cell label="name" value={z.name} width={150} onCommit={(v) => upsert.mutate({ ...z, name: v })} />
                </td>
                <td>
                  <Cell label="county" value={z.county} width={110} onCommit={(v) => upsert.mutate({ ...z, county: v })} />
                </td>
                <td>
                  <Cell
                    label="avgPrice"
                    numeric
                    value={z.avgPrice}
                    width={90}
                    onCommit={(v) => upsert.mutate({ ...z, avgPrice: Number(v) || 0 })}
                  />
                </td>
                <td>
                  <Cell
                    label="emergingScore"
                    numeric
                    value={z.emergingScore}
                    width={60}
                    onCommit={(v) => upsert.mutate({ ...z, emergingScore: Number(v) || 0 })}
                  />
                </td>
                <td>
                  <Cell
                    label="priceVelocity"
                    numeric
                    value={z.priceVelocity}
                    width={60}
                    onCommit={(v) => upsert.mutate({ ...z, priceVelocity: Number(v) || 0 })}
                  />
                </td>
                <td>
                  <Cell
                    label="permits"
                    numeric
                    value={z.permits}
                    width={70}
                    onCommit={(v) => upsert.mutate({ ...z, permits: Number(v) || 0 })}
                  />
                </td>
                <td>
                  <Cell
                    label="inventoryMonths"
                    numeric
                    value={z.inventoryMonths}
                    width={60}
                    onCommit={(v) => upsert.mutate({ ...z, inventoryMonths: Number(v) || 0 })}
                  />
                </td>
                <td style={{ textAlign: "right" }}>
                  <button
                    type="button"
                    className="btn btn-ghost micro"
                    style={{ padding: 0 }}
                    disabled={remove.isPending}
                    onClick={() => remove.mutate({ zip: z.zip })}
                  >
                    DELETE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Plate>
  );
}

function LeadsTab() {
  const rows = useAdminLeads();
  const upsert = useUpsertLead();
  const remove = useDeleteLead();

  if (rows.isLoading) return <Loading label="LOADING LEADS" />;

  return (
    <Plate
      label="LEAD INVENTORY"
      right={`${num(rows.data?.length ?? 0)} LISTED · PRICE DROPS $50 AFTER 7 DAYS`}
      bodyStyle={{ padding: 0 }}
    >
      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 1000 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Audience</th>
              <th>Tier</th>
              <th>Location</th>
              <th>Score</th>
              <th>Price</th>
              <th>Views</th>
              <th>Interested</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {(rows.data ?? []).map((l) => (
              <tr key={l.id}>
                <td className="micro text-muted">{l.id}</td>
                <td className="micro">{l.audience.toUpperCase()}</td>
                <td>
                  <Cell label="tier" value={l.tier} width={90} onCommit={(v) => upsert.mutate({ ...l, tier: v })} />
                </td>
                <td>
                  <Cell
                    label="location"
                    numeric
                    value={l.location}
                    width={60}
                    onCommit={(v) => upsert.mutate({ ...l, location: Number(v) || 0 })}
                  />
                </td>
                <td>
                  <Cell
                    label="score"
                    numeric
                    value={l.score}
                    width={60}
                    onCommit={(v) => upsert.mutate({ ...l, score: Number(v) || 0 })}
                  />
                </td>
                <td>
                  <Cell
                    label="price"
                    numeric
                    value={l.price}
                    width={80}
                    onCommit={(v) => upsert.mutate({ ...l, price: Number(v) || 0 })}
                  />
                </td>
                <td>
                  <Cell
                    label="views"
                    numeric
                    value={l.views}
                    width={60}
                    onCommit={(v) => upsert.mutate({ ...l, views: Number(v) || 0 })}
                  />
                </td>
                <td>
                  <Cell
                    label="interested"
                    numeric
                    value={l.interested}
                    width={60}
                    onCommit={(v) => upsert.mutate({ ...l, interested: Number(v) || 0 })}
                  />
                </td>
                <td style={{ textAlign: "right" }}>
                  <button
                    type="button"
                    className="btn btn-ghost micro"
                    style={{ padding: 0 }}
                    disabled={remove.isPending}
                    onClick={() => remove.mutate({ id: l.id })}
                  >
                    DELETE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Plate>
  );
}

const GRANTABLE = ["investor", "realtor", "contractor", "admin"];

function UsersTab() {
  const rows = useAdminUsers();
  const grant = useGrantRole();

  if (rows.isLoading) return <Loading label="LOADING USERS" />;

  return (
    <Plate label="ACCOUNTS" right={`${num(rows.data?.length ?? 0)} REGISTERED`} bodyStyle={{ padding: 0 }}>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Roles</th>
            <th style={{ textAlign: "right" }}>Grant role</th>
          </tr>
        </thead>
        <tbody>
          {(rows.data ?? []).map((u) => (
            <tr key={u.id}>
              <td>{u.name || "—"}</td>
              <td className="text-muted">{u.email}</td>
              <td className="micro">{u.roles.length ? u.roles.join(" · ").toUpperCase() : "NONE"}</td>
              <td style={{ textAlign: "right" }}>
                <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                  {grant.isPending ? <Spinner /> : null}
                  {GRANTABLE.filter((r) => !u.roles.includes(r)).map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="btn btn-ghost micro"
                      style={{ padding: 0 }}
                      disabled={grant.isPending}
                      onClick={() => grant.mutate({ userId: u.id, role: r })}
                    >
                      +{r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Plate>
  );
}
