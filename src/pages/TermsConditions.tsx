import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header activeSection="" onSectionChange={() => {}} />
      <div className="pt-20 px-4">
        <div className="container mx-auto max-w-4xl py-12">
          <h1 className="text-4xl font-bold gradient-text mb-8 text-center">Terms & Conditions</h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Party Panther ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. These Terms & Conditions apply to all users of the service, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
              <p className="text-muted-foreground">
                Permission is granted to temporarily download one copy of Party Panther materials for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to reverse engineer any software contained on the Platform</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Event Creation and Participation</h2>
              <p className="text-muted-foreground">
                Users can create and join events through the Platform. Event creators are responsible for providing accurate information about their events. Party Panther is not responsible for the conduct of event organizers or attendees, or for any events listed on the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Promotional Content</h2>
              <p className="text-muted-foreground">
                Users can post promotional content for venues and events. All promotional content must be accurate and truthful. Party Panther reserves the right to remove any content that violates these terms or is deemed inappropriate.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Privacy Policy</h2>
              <p className="text-muted-foreground">
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our service. By using our service, you agree to the collection and use of information in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Prohibited Uses</h2>
              <p className="text-muted-foreground">
                You may not use our service:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li>For any unlawful purpose or to solicit others to commit unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Disclaimer</h2>
              <p className="text-muted-foreground">
                The information on this Platform is provided on an 'as is' basis. To the fullest extent permitted by law, Party Panther excludes all representations, warranties, conditions, and terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Limitations</h2>
              <p className="text-muted-foreground">
                In no event shall Party Panther or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Party Panther's Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground">
                Party Panther may revise these terms of service at any time without notice. By using this Platform, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms & Conditions, please contact us at legal@partypanther.com.
              </p>
            </section>

            <div className="text-center mt-12 text-sm text-muted-foreground">
              <p>Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
      <Footer onSectionChange={() => {}} />
    </div>
  );
};

export default TermsConditions;