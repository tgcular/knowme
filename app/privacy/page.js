import LegalPage, { CONTACT_EMAIL } from "@/components/LegalPage";
export const metadata = { title: "Privacy Policy – KnowMe" };
const H = ({ children }) => <h2 className="pt-2 text-xl font-semibold text-white">{children}</h2>;

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>KnowMe is a personal diary app. This page explains what we collect and how it is used.</p>
      <H>What we collect</H>
      <p>Your email address and display name, and if you sign in with Google, the basic profile information Google shares (email and name). We also store what you create: diary text, moods, dates and times, and the front and back photos you take.</p>
      <H>How it is used</H>
      <p>Only to run the app: to sign you in, and to show your entries and photos back to you on your devices. We do not sell your data, show ads, or use your photos or entries for anything else.</p>
      <H>Who can see your entries</H>
      <p>Entries are private by default. For each entry you can choose to share it with selected friends, with all KnowMe users, or with anyone who has its link. People you share with can see that entry's photos, mood, text, and time, and your display name and username. Friends are added by request and approval. You can change an entry's visibility or turn off its link at any time.</p>
      <H>Where it is stored</H>
      <p>Your data is stored with our service providers: Supabase (accounts, database, and photo storage) and Vercel (hosting). Photos are kept in private storage and are only accessible to your account unless you share them.</p>
      <H>Camera and music</H>
      <p>The camera is used only when you take a photo for an entry. Music is played from YouTube or Spotify embeds, which are governed by their own privacy policies. A music link you paste is saved only in your own browser.</p>
      <H>Deleting your data</H>
      <p>You can delete individual entries, or delete your whole account from the Me page. Deleting your account permanently removes your profile, entries, and photos.</p>
      <H>Contact</H>
      <p>Questions about privacy: {CONTACT_EMAIL}</p>
    </LegalPage>
  );
}
