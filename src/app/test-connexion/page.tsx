"use client";

/**
 * PAGE DE TEST TEMPORAIRE (partie back, Rémy) : vérifie que la connexion Supabase et la table `profiles` marchent.
 * Elle n'a pas de design exprès. Elle sera supprimée quand la vraie page de connexion de Benjamin sera prête.
 * Adresse : http://localhost:3000/test-connexion
 */

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/env";
import { loadProgress, saveAttempt } from "@/lib/progress/api";
import type { ProgressSnapshot } from "@/lib/progress/contract";

const GRADES = ["6e", "5e", "4e", "3e", "2nde", "1re", "Tle"] as const;

type ProfileRow = { id: string; pseudo: string; grade: string; passions: string[]; onboarded: boolean; created_at: string };

const box: CSSProperties = { maxWidth: 480, margin: "32px auto", padding: 16, fontFamily: "system-ui, sans-serif", lineHeight: 1.5 };
const row: CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" };
const input: CSSProperties = { flex: 1, minWidth: 180, padding: 8, border: "1px solid #999", borderRadius: 6 };
const button: CSSProperties = { padding: "8px 12px", borderRadius: 6, border: "1px solid #555", cursor: "pointer" };

export default function TestConnexionPage() {
  if (!supabaseConfigured) {
    return (
      <main style={box}>
        <h1>Test connexion</h1>
        <p>Supabase n&apos;est pas configuré : crée <code>.env.local</code> à partir de <code>.env.example</code>, puis relance <code>npm run dev</code>.</p>
      </main>
    );
  }
  return <TestConnexion />;
}

function TestConnexion() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [grade, setGrade] = useState<string>("2nde");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);

  const loadProfile = useCallback(
    async (u: User | null) => {
      if (!u) return setProfile(null);
      const { data, error } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
      if (error) setMessage(`Erreur en lisant le profil : ${error.message}`);
      setProfile((data as ProfileRow | null) ?? null);
    },
    [supabase],
  );

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("erreur") === "lien") {
      setMessage("Le lien reçu par mail n'a pas marché (expiré, déjà utilisé, ou ouvert dans un autre navigateur).");
    }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      void loadProfile(data.user);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      void loadProfile(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, loadProfile]);

  const redirectTo = () => `${window.location.origin}/auth/callback?next=/test-connexion`;

  async function signUp() {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
    if (error) return setMessage(`Inscription refusée : ${error.message}`);
    setMessage(data.session ? "Compte créé et connecté." : "Compte créé : clique sur le lien reçu par mail pour le confirmer.");
  }

  async function signIn(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? `Connexion refusée : ${error.message}` : "Connecté avec le mot de passe.");
  }

  async function magicLink() {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    setMessage(error ? `Envoi refusé : ${error.message}` : "Lien envoyé : ouvre-le dans CE navigateur.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setMessage("Déconnecté.");
  }

  async function createProfile(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("profiles").insert({ id: user.id, pseudo, grade });
    if (error) return setMessage(`Profil refusé : ${error.message}`);
    setMessage("Profil créé.");
    void loadProfile(user);
  }

  /** Envoie une fausse séance de 3 exercices, comme le fera l'appli à la fin d'une vraie séance. */
  async function saveTestAttempt() {
    const at = new Date().toISOString();
    const due = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
    const res = await saveAttempt({
      clientId: crypto.randomUUID(),
      kind: "session",
      sessionId: "seance-de-test",
      unitId: "chapitre-de-test",
      avgSeconds: 35,
      evidence: [
        { unitId: "chapitre-de-test", itemId: "exo-1", at, stage: "rappel", result: "success", assistance: 0 },
        { unitId: "chapitre-de-test", itemId: "exo-2", at, stage: "application", result: "partial", assistance: 2, errorType: "calcul" },
        { unitId: "chapitre-de-test", itemId: "exo-3", at, stage: "transfert", result: "fail", assistance: 4, errorType: "conceptuelle" },
      ],
      reviews: [{ unitId: "chapitre-de-test", due, reason: "Séance de test : rappel dans 3 jours." }],
    });
    setMessage(res.ok ? `Séance enregistrée (${res.attemptId.slice(0, 8)}…).` : `Séance refusée (${res.status}) : ${res.error}`);
    if (res.ok) setProgress(await loadProgress());
  }

  return (
    <main style={box}>
      <h1>Test connexion (temporaire)</h1>
      {message && <p style={{ padding: 8, background: "#8882", borderRadius: 6 }}>{message}</p>}

      {!user ? (
        <form onSubmit={signIn}>
          <div style={row}>
            <input style={input} type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={row}>
            <input style={input} type="password" placeholder="mot de passe (6 caractères min.)" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div style={row}>
            <button style={button} type="submit">Se connecter (mot de passe)</button>
            <button style={button} type="button" onClick={signUp}>Créer un compte</button>
            <button style={button} type="button" onClick={magicLink}>Recevoir un lien par mail</button>
          </div>
        </form>
      ) : (
        <>
          <p>Connecté : <strong>{user.email}</strong></p>
          {profile ? (
            <>
              <p>Profil trouvé dans Supabase :</p>
              <pre style={{ padding: 8, background: "#8882", borderRadius: 6, overflowX: "auto" }}>{JSON.stringify(profile, null, 2)}</pre>
            </>
          ) : (
            <form onSubmit={createProfile}>
              <p>Pas encore de profil. Crée-le :</p>
              <div style={row}>
                <input style={input} placeholder="pseudo (2 à 20 caractères)" value={pseudo} onChange={(e) => setPseudo(e.target.value)} required minLength={2} maxLength={20} />
                <select style={input} value={grade} onChange={(e) => setGrade(e.target.value)}>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <button style={button} type="submit">Créer mon profil</button>
            </form>
          )}
          {profile && (
            <>
              <h2 style={{ fontSize: 18, marginTop: 24 }}>Progression</h2>
              <div style={row}>
                <button style={button} type="button" onClick={saveTestAttempt}>Enregistrer une séance de test</button>
                <button style={button} type="button" onClick={async () => setProgress(await loadProgress())}>Recharger ma progression</button>
              </div>
              {progress && (
                <p>
                  {progress.evidence.length} exercice{progress.evidence.length > 1 ? "s" : ""} enregistré{progress.evidence.length > 1 ? "s" : ""},{" "}
                  {progress.reviews.length} rappel{progress.reviews.length > 1 ? "s" : ""} de révision
                  {progress.reviews[0] ? ` (prochain : ${progress.reviews[0].due})` : ""}.
                </p>
              )}
            </>
          )}
          <div style={row}>
            <button style={button} type="button" onClick={signOut}>Se déconnecter</button>
          </div>
        </>
      )}
    </main>
  );
}
