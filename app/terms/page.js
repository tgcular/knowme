import LegalPage, { CONTACT_EMAIL } from "@/components/LegalPage";
export const metadata = { title: "Terms of Service – KnowMe" };
const H = ({ children }) => <h2 className="pt-2 text-xl font-semibold text-white">{children}</h2>;

export default function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p>By using KnowMe you agree to these terms.</p>
      <H>Your account</H>
      <p>You are responsible for your account and your password. Please provide accurate information and keep your login secure.</p>
      <H>Your content</H>
      <p>You own your diary entries and photos. You agree not to upload content that is illegal or that shows or harms other people without their permission.</p>
      <H>Using the service</H>
      <p>KnowMe is provided as is, without guarantees. It is a personal project, so features may change and the service may be unavailable at times. Please do not rely on it as your only copy of important memories.</p>
      <H>Ending your use</H>
      <p>You can delete your account at any time from the Me page. We may suspend accounts that abuse the service.</p>
      <H>Contact</H>
      <p>Questions: {CONTACT_EMAIL}</p>
    </LegalPage>
  );
}
