// Manage.tsx
import { FormEvent, useMemo, useState } from "react";
import { useCreateExperienceBlock } from "@cctv/hooks/useCreateExperienceBlock";
import { useExperience } from "@cctv/contexts/ExperienceContext";
import { Button } from "@cctv/core";

import styles from "./Manage.module.scss";

export default function Manage() {
  const {
    experience,
    user,
    code,
    isLoading,
    isPolling,
    experienceStatus,
    error: experienceError,
  } = useExperience();

  const {
    createExperienceBlock,
    isLoading: creating,
    error: createError,
    setError: setCreateError,
  } = useCreateExperienceBlock();

  // form state
  const [kind, setKind] = useState<string>("poll"); // default kind
  const [payloadText, setPayloadText] = useState<string>('{"question":"Your question","options":["A","B"]}');
  const [openImmediately, setOpenImmediately] = useState<boolean>(false);
  const [visibleRolesText, setVisibleRolesText] = useState<string>(""); // comma-separated
  const [visibleSegmentsText, setVisibleSegmentsText] = useState<string>(""); // comma-separated
  const [targetUserIdsText, setTargetUserIdsText] = useState<string>(""); // comma-separated

  const topError = useMemo(
    () => createError || experienceError,
    [createError, experienceError]
  );

  if (isLoading) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code || "Experience"}</h1>
        <p className={styles.subtitle}>Preparing experience…</p>
      </section>
    );
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    console.log("on submit")
    e.preventDefault();
    setCreateError(null);

    let payload: Record<string, any> = {};
    try {
      payload = payloadText.trim() ? JSON.parse(payloadText) : {};
    } catch {
      setCreateError("Payload must be valid JSON");
      return;
    }

    const visible_to_roles = visibleRolesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const visible_to_segments = visibleSegmentsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const target_user_ids = targetUserIdsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const submitPayload = {
      kind,
      payload,
      visible_to_roles,
      visible_to_segments,
      target_user_ids,
      status: "hidden",
      open_immediately: openImmediately,
    }

    console.log("payload: ", submitPayload)

    const resp = await createExperienceBlock(submitPayload)

    if (resp?.success) {
      // Optional: reset form or show a toast
      // setPayloadText("{}");
      // setOpenImmediately(false);
    }
  };

  return (
    <section className="page">
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{code}</h1>
        <div className={styles.meta}>
          <div>Status: {experienceStatus}</div>
          {user?.email && <span> • You: {user.email}</span>}
        </div>
      </div>

      {topError && (
        <div className={styles.errorBanner} role="alert">
          {topError}
        </div>
      )}

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

          <div>
            <label className={styles.label}>
              Visible to roles (comma-separated)
              <input
                className={styles.input}
                type="text"
                value={visibleRolesText}
                onChange={(e) => setVisibleRolesText(e.target.value)}
                placeholder="host, participant"
              />
            </label>
          </div>

          <div>
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
            <input
              type="checkbox"
              checked={openImmediately}
              onChange={(e) => setOpenImmediately(e.target.checked)}
            />
            Open immediately
          </label>

          <div className={styles.actions}>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create Block"}
            </Button>
          </div>
        </form>
      </div>

      {experience?.blocks && Array.isArray(experience.blocks) && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Existing Blocks</h2>
          <pre className={styles.pre}>
            {JSON.stringify(experience.blocks, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}

