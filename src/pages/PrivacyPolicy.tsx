import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePageTitle } from "@/hooks/usePageTitle";

const PrivacyPolicy = () => {
  usePageTitle("Privacy Policy");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 px-4">
        <div className="container mx-auto max-w-4xl py-12">
          <h1 className="text-4xl font-bold gradient-text mb-8 text-center">Privacy Policy</h1>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <p className="text-muted-foreground">
                This Privacy Policy describes how Party Panther ("we", "us", or "our") collects, uses, stores, and protects your personal information when you use our platform at partypanther.net and any associated services. By using Party Panther, you agree to the practices described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground">
                We collect information to provide and improve our services. The types of information we collect include:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li><strong>Account Information:</strong> When you register, we collect your email address and authentication credentials via Supabase. If you sign in with Google, we receive your name, email, and profile picture from Google in accordance with their privacy practices.</li>
                <li><strong>Profile Information:</strong> You may optionally provide additional details such as a display name, phone number, business information, and profile photo.</li>
                <li><strong>Event and Promo Content:</strong> When you create or interact with events, promotions, or venues, we collect the content you submit, including titles, descriptions, dates, pricing, images, and location data.</li>
                <li><strong>Location Data:</strong> If you use map features or search for nearby venues, we may process geographic location data with your consent.</li>
                <li><strong>Usage Data:</strong> We collect information about how you interact with the platform, such as pages visited, features used, and device/browser information.</li>
                <li><strong>Communications:</strong> We store messages sent through contact forms, comments, reviews, and replies you submit on the platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li>To provide, maintain, and improve Party Panther and its features</li>
                <li>To authenticate your identity and manage your account</li>
                <li>To display events, promotions, and venue listings you create or interact with</li>
                <li>To enable location-based search and map features</li>
                <li>To send notifications, updates, and promotional communications (with your consent where required)</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To enforce our Terms & Conditions and protect the security of our platform</li>
                <li>To analyze usage trends and optimize the user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Authentication and Third-Party Services</h2>
              <p className="text-muted-foreground">
                We use Supabase for authentication and database services. When you choose to sign in with Google, you are subject to Google's Privacy Policy and Terms of Service. We only receive the information that Google explicitly shares with us, and we do not have access to your Google password.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Cookies and Similar Technologies</h2>
              <p className="text-muted-foreground">
                We use cookies and similar technologies to keep you signed in, remember your preferences, and understand how you use our platform. You can control cookies through your browser settings, though disabling them may affect functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground">
                We do not sell your personal information. We may share data in the following limited circumstances:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li><strong>Service Providers:</strong> We use trusted third-party providers (such as Supabase, Google Maps, and cloud storage services) to host and operate our platform. These providers are contractually bound to protect your data.</li>
                <li><strong>Public Content:</strong> Event listings, promotions, venue information, and public comments you submit are visible to other users and visitors of the platform.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law, regulation, or legal process, or to protect the rights, property, or safety of Party Panther, our users, or others.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
              <p className="text-muted-foreground">
                We implement reasonable technical and organizational measures to protect your personal information, including encryption in transit, access controls, and Row Level Security (RLS) on our database. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as your account is active or as needed to provide you with our services. You may request deletion of your account and associated data by contacting us. Some information may be retained for legal, security, or business purposes as permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
              <p className="text-muted-foreground">
                Depending on your jurisdiction, you may have rights regarding your personal data, including:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li>The right to access and receive a copy of your personal information</li>
                <li>The right to correct inaccurate or incomplete information</li>
                <li>The right to request deletion of your personal information</li>
                <li>The right to object to or restrict certain processing of your data</li>
                <li>The right to data portability</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                To exercise these rights, please contact us using the information below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Party Panther is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child under 18, we will take steps to delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your country of residence, including the United States and other jurisdictions where our service providers operate. We take appropriate safeguards to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on our platform with an updated effective date. Your continued use of Party Panther after any changes constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Email:</strong> info@partypanther.id
              </p>
            </section>

            <div className="text-center mt-12 text-sm text-muted-foreground">
              <p>Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
