import { FormEvent, useMemo, useState, useCallback, useEffect } from "react";
import { useCreateExperienceBlock } from "@cctv/hooks/useCreateExperienceBlock";
import { useExperienceStart } from "@cctv/hooks/useExperienceStart";
import { useExperience } from "@cctv/contexts/ExperienceContext";
import { Button } from "@cctv/core";

import styles from "./Manage.module.scss";

import { ParticipantWithRole, ExperienceWithParticipants, Block } from "@cctv/types"

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString() : "—");

function KVPill({ label }: { label: string }) {
  return <span className={styles.pill}>{label}</span>;
}

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className={styles.headerRow}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <div className={styles.headerActions}>{children}</div>
    </div>
  );
}

function ParticipantsTable({ rows }: { rows: ParticipantWithRole[] }) {
  if (!rows?.length) return <div className={styles.emptyState}>No participants yet.</div>;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={`${p.role}:${p.id}`}>
              <td className={styles.mono}>{p.id}</td>
              <td>{p.name || "—"}</td>
              <td>{p.email || "—"}</td>
              <td>
                <KVPill label={p.role} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlockRowMenu({
  block,
  onChange,
  busy,
}: {
  block: Block;
  onChange: (next: BlockStatus) => void;
  busy?: boolean;
}) {
  const choose = (status: BlockStatus) => () => onChange(status);
  return (
    <details className={styles.menu}>
      <summary className={styles.menuButton} aria-label="Open row actions" />
      <div className={styles.menuList} role="menu">
        <button className={styles.menuItem} onClick={choose("open")} disabled={busy || block.status === "open"}>
          Set “open”
        </button>
        <button className={styles.menuItem} onClick={choose("closed")} disabled={busy || block.status === "closed"}>
          Set “closed”
        </button>
        <button className={styles.menuItem} onClick={choose("hidden")} disabled={busy || block.status === "hidden"}>
          Set “hidden”
        </button>
      </div>
    </details>
  );
}

function BlocksTable({ blocks, onChange, busyId, participants }: { 
  blocks: Block[]; 
  onChange: (b: Block, s: BlockStatus) => void; 
  busyId?: string | null;
  participants?: ParticipantWithRole[];
}) {
  if (!blocks?.length) return <div className={styles.emptyState}>No blocks yet.</div>;
  
  const totalParticipants = participants?.length || 0;
  
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Block ID</th>
            <th>Kind</th>
            <th>Status</th>
            <th>Responses</th>
            <th>Visible roles</th>
            <th>Segments</th>
            <th>Targets</th>
            <th>Created</th>
            <th aria-label="Row actions" />
          </tr>
        </thead>
        <tbody>
          {blocks.map((b) => (
            <tr key={b.id}>
              <td className={styles.mono}>{b.id}</td>
              <td>{b.kind}</td>
              <td>
                <KVPill label={b.status} />
                {busyId === b.id && <span className={styles.subtle}> • updating…</span>}
              </td>
              <td>
                {b.kind === 'poll' && b.responses ? (
                  <div>
                    <div>{b.responses.total} / {totalParticipants}</div>
                    {b.responses.aggregate && Object.keys(b.responses.aggregate).length > 0 && (
                      <details className={styles.pollDetails}>
                        <summary>View breakdown</summary>
                        <ul className={styles.pollBreakdown}>
                          {Object.entries(b.responses.aggregate).map(([option, count]) => (
                            <li key={option}>
                              {option}: {count} ({Math.round((count / b.responses.total) * 100)}%)
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td>{b.visible_to_roles?.length ? b.visible_to_roles.map((r) => <KVPill key={r} label={r} />) : "—"}</td>
              <td>{b.visible_to_segments?.length ? b.visible_to_segments.map((s) => <KVPill key={s} label={s} />) : "—"}</td>
              <td>{b.target_user_ids?.length ?? 0}</td>
              <td>{fmtDate(b.created_at)}</td>
              <td className={styles.rowMenuCell}>
                <BlockRowMenu block={b} onChange={(s) => onChange(b, s)} busy={busyId === b.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useChangeBlockStatus() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = useCallback(
    async (block: Block, status: BlockStatus): Promise<{ success: boolean; error?: string } | null> => {
      if (!code) {
        setError("Missing experience code");
        return null;
      }
      setIsLoading(true);
      setError(null);

      const baseUrl = `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(block.id)}/`

      try {
        let path = "";
        const method = "POST";
        let body: any = undefined;

        if (status === "open") {
          path = `${baseUrl}open`;
        } else if (status === "closed") {
          path = `${baseUrl}close`;
        }

        body = JSON.stringify({ experience: { status: "hidden" } });

        const res = await experienceFetch(path, { method, body });
        const data = await res.json();
        if (!res.ok || data?.success === false) {
          const msg = data?.error || `Failed to set status to ${next}`;
          setError(msg);

          return { success: false, error: msg };
        }
        return { success: true };
      } catch (e: any) {
        const msg = e?.message === "Authentication expired" ? "Authentication expired" : "Connection error. Please try again.";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [code, experienceFetch]
  );

  return { change, isLoading, error, setError };
}

export default function Manage() {
  const {
    experience,
    user,
    code,
    isLoading,
    isPolling,
    experienceStatus,
    error: experienceError,
    experienceFetch
  } = useExperience();

  const {
    createExperienceBlock,
    isLoading: creating,
    error: createError,
    setError: setCreateError
  } = useCreateExperienceBlock();

  const {
    startExperience,
    isLoading: starting,
    error: startError,
    setError: setStartError
  } = useExperienceStart();

  const [model, setModel] = useState(experience)

  useEffect(() => {
    setModel(experience as any);
  }, [experience]);

  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [busyBlockId, setBusyBlockId] = useState<string | null>(null);

  const [kind, setKind] = useState<string>("poll");
  const [payloadText, setPayloadText] = useState<string>(
    '{"question":"Your question","options":["A","B"]}'
  );
  const [openImmediately, setOpenImmediately] = useState<boolean>(false);
  const [visibleRolesText, setVisibleRolesText] = useState<string>("");
  const [visibleSegmentsText, setVisibleSegmentsText] = useState<string>("");
  const [targetUserIdsText, setTargetUserIdsText] = useState<string>("");

  const topError = useMemo(() => createError || experienceError, [createError, experienceError]);

  const participantsCombined: ParticipantWithRole[] = [
    ...(model?.hosts || []),
    ...(model?.participants || []),
  ];

  const blocks: Block[] = Array.isArray((model as any)?.blocks) ? ((model as any)?.blocks as Block[]) : [];

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError(null);

    let payload: Record<string, any> = {};
    try {
      payload = payloadText.trim() ? JSON.parse(payloadText) : {};
    } catch {
      setCreateError("Payload must be valid JSON");
      return;
    }

    const visible_to_roles = visibleRolesText.split(",").map((s) => s.trim()).filter(Boolean) as ParticipantRole[];
    const visible_to_segments = visibleSegmentsText.split(",").map((s) => s.trim()).filter(Boolean);
    const target_user_ids = targetUserIdsText.split(",").map((s) => s.trim()).filter(Boolean);

    const submitPayload = {
      kind,
      payload,
      visible_to_roles,
      visible_to_segments,
      target_user_ids,
      status: "hidden" as BlockStatus,
      open_immediately: openImmediately,
    };

    const resp = await createExperienceBlock(submitPayload);
    if (resp?.success) {
      // Re-fetch the experience to show the newly created block
      // TODO: This should be wired up with query caching
      if (code) {
        try {
          const res = await experienceFetch(`/api/experiences/${encodeURIComponent(code)}`, { method: "GET" });
          const data = (await res.json()) as { success?: boolean; experience?: ExperienceWithParticipants & { blocks?: Block[] } };
          if ((res.ok && data?.experience) || data?.success) setModel((data as any).experience || (data as any));
        } catch {}
      }
      setShowCreate(false);
    }
  };

  const { change: changeStatus, isLoading: changingStatus, error: statusError, setError: setStatusError } = useChangeBlockStatus();

  const onChangeBlockStatus = useCallback(
    async (block: Block, next: BlockStatus) => {
      if (!code) return;
      setBusyBlockId(block.id);
      setStatusError(null);

      const result = await changeStatus(block, next);

      // No optimistic updates: re-fetch experience when done
      if (code) {
        try {
          const res = await experienceFetch(`/api/experiences/${encodeURIComponent(code)}`, { method: "GET" });
          const data = (await res.json()) as { success?: boolean; experience?: ExperienceWithParticipants & { blocks?: Block[] } };
          if ((res.ok && data?.experience) || data?.success) setModel((data as any).experience || (data as any));
        } catch {}
      }

      if (!result?.success && result?.error) {
        alert(result.error);
      }

      setBusyBlockId(null);
    },
    [code, experienceFetch, changeStatus, setStatusError]
  );

  if (isLoading) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code || "Experience"}</h1>
        <p className={styles.subtitle}>Preparing experience…</p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{code}</h1>
        { experience.status === "lobby" && (
          <Button
            variant="primary"
            onClick={() => startExperience()}
            disabled={starting}
          >
            {starting ? "Starting..." : "Start!"}
          </Button>
        )}
        { experience.status === "live" && (
          <div>Back to Lobby!</div>
        )}
        <div className={styles.meta}>
          <div>
            Status: <KVPill label={experienceStatus || "—"} />
            {isPolling ? <span className={styles.subtle}> • polling</span> : null}
            {changingStatus && <span className={styles.subtle}> • updating block…</span>}
          </div>
          {user?.email && <span> • You: {user.email}</span>}
        </div>
      </div>

      {(topError || statusError || startError) && (
        <div className={styles.errorBanner} role="alert">
          {topError || statusError || startError}
        </div>
      )}

      {/* Participants */}
      <div className={styles.card}>
        <SectionHeader title="Experience Participants" />
        <ParticipantsTable rows={participantsCombined} />
      </div>

      {/* Blocks */}
      <div className={styles.card}>
        <SectionHeader title="Experience Blocks">
          <Button variant="primary" size="sm" onClick={() => setShowCreate((v) => !v)} aria-expanded={showCreate}>
            {showCreate ? "Close form" : "Add new"}
          </Button>
        </SectionHeader>

        <BlocksTable 
          blocks={blocks} 
          onChange={onChangeBlockStatus} 
          busyId={busyBlockId} 
          participants={participantsCombined}
        />
      </div>

      {/* Create Block (collapsible) */}
      {showCreate && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Create Block</div>
          <form onSubmit={onSubmit} className={styles.form}>
            <div>
              <label className={styles.label}>
                Kind:
                <input
                  className={styles.input}
                  type="text"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  placeholder="poll | text | media | ..."
                  required
                />
              </label>
            </div>

            <div>
              <label className={styles.label}>
                Payload (JSON)
                <div>
                  <textarea
                    className={styles.textarea}
                    rows={8}
                    value={payloadText}
                    onChange={(e) => setPayloadText(e.target.value)}
                    placeholder='{"question":"Your question","options":["A","B"]}'
                  />
                </div>
              </label>
            </div>

            <div className={styles.grid2}>
              <label className={styles.label}>
                Visible to roles (comma-separated)
                <input
                  className={styles.input}
                  type="text"
                  value={visibleRolesText}
                  onChange={(e) => setVisibleRolesText(e.target.value)}
                  placeholder="host, audience"
                />
              </label>

              <label className={styles.label}>
                Visible to segments (comma-separated)
                <input
                  className={styles.input}
                  type="text"
                  value={visibleSegmentsText}
                  onChange={(e) => setVisibleSegmentsText(e.target.value)}
                  placeholder="segment-a, segment-b"
                />
              </label>
            </div>

            <div>
              <label className={styles.label}>
                Target user IDs (comma-separated UUIDs)
                <input
                  className={styles.input}
                  type="text"
                  value={targetUserIdsText}
                  onChange={(e) => setTargetUserIdsText(e.target.value)}
                  placeholder="uuid-1, uuid-2"
                />
              </label>
            </div>

            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={openImmediately} onChange={(e) => setOpenImmediately(e.target.checked)} />
              Open immediately
            </label>

            <div className={styles.actions}>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create Block"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

