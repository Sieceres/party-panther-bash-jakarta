import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePageTitle } from "@/hooks/usePageTitle";

const Lintang = () => {
  usePageTitle("Proposal for Lintang");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 pt-32 pb-12 max-w-3xl">
        {/* Hero Title */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-neon-cyan to-neon-blue bg-clip-text text-transparent mb-4">
            Lintang Proposal!
          </h1>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-neon-cyan mb-4">Introduction</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            With this page, I want to explain briefly(ish) why I would like to have you on the Party Panther team (which is mostly a one man team at the moment), and possibly more importantly, why I think it could be useful for you to join. I created a separate page for it to demonstrate how flexible the platform is. In line with your business idea, I have also created a prototype for a voucher system, where the creator of a promo can choose to enable voucher redemption:
          </p>

          <div className="rounded-xl overflow-hidden border border-border mb-6">
            <img
              src="/lintang/voucher-settings.png"
              alt="Voucher redemption settings showing single-use and multi-use options"
              className="w-full"
            />
          </div>

          <p className="text-muted-foreground leading-relaxed mb-6">
            I call this a "prototype" because I created it just to show you the possibility. For the user it looks like this now:
          </p>

          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            <div className="flex-1 rounded-xl overflow-hidden border border-border">
              <img
                src="/lintang/promo-mobile.jpg"
                alt="Demo promo page showing Claim Voucher button"
                className="w-full"
              />
            </div>
            <div className="flex-1 rounded-xl overflow-hidden border border-border">
              <img
                src="/lintang/voucher-claimed.jpg"
                alt="Claimed voucher with QR code and alphanumeric code"
                className="w-full"
              />
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            And then the current logic means that a venue scans the code and enters a PIN code to verify the voucher. So it's not at all set in stone how we would do this, there are a few different solutions for it and I haven't really tested it. If you have another method or logic for this in mind, I don't have any problem changing it, it's just to demonstrate the possibility. Now let's move on to…
          </p>
        </section>

        {/* Benefits for Lintang */}
        <section className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-neon-cyan mb-4">
            What are the benefits for Lintang when it comes to joining the Party Panther team?
          </h2>
          <ul className="space-y-4 text-muted-foreground leading-relaxed list-disc list-outside pl-5">
            <li>Mutual benefits, see below.</li>
            <li>
              You get an existing platform with database capabilities for users, venues, promos, and events. There's also currently a map of venues which needs some improvement, but the basis is there. This all already works, if you have any input or suggestions to change/improve this, I am listening and willing to change.
            </li>
            <li>
              A huge amount of features for admins, including statistics, admin features (ban/edit/delete) which most users will never see. There's also an Instagram generator so we can easily create Instagram posts that are in line with the Party Panther palette. Here you can see what the dashboard looks like, voucher management would obviously be added:
            </li>
          </ul>

          <div className="rounded-xl overflow-hidden border border-border my-6">
            <img
              src="/lintang/admin-dashboard.jpg"
              alt="Party Panther admin dashboard showing analytics, events, promos, and user management"
              className="w-full"
            />
          </div>

          <ul className="space-y-4 text-muted-foreground leading-relaxed list-disc list-outside pl-5">
            <li>
              Existing domain{" "}
              <a href="https://www.partypanther.net" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">
                www.partypanther.net
              </a>{" "}
              and WhatsApp group. The Instagram account got hacked and might not be possible to get back, but I'll keep trying and if it doesn't work, I'll create a new one. I have already written the content for some IG posts but they never got posted, partially because I wanted to run it by some others before posting but the others in the team were not too available to give me feedback.
            </li>
            <li>
              Part of my long term plan is to have more cooperation with all the venues. One day, I'm hoping that they themselves will create events and promos, and update/delete the promos when they make changes to them. When we already have a connection, it should be easy for you to build on that and propose some promo deals where users pay for some benefits.
            </li>
            <li>
              I will not ask you to share any of the profit you make on this in the first few months. Or maybe never. We need to think this through and set up a contract where such things are agreed upon.
            </li>
          </ul>
        </section>

        {/* Why Lintang */}
        <section className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-neon-cyan mb-4">
            Why do I want to have Lintang on my team?
          </h2>
          <ul className="space-y-4 text-muted-foreground leading-relaxed list-disc list-outside pl-5">
            <li>
              Mutual benefits of marketing – getting users, cooperation with venues et.c. More users for me means more users for you and vice versa. The platform will grow and more users means that venues "have to" use Party Panther, if not they could potentially be missing out on the chance of getting customers. This creates a positive spiral and the sky is the limit!
            </li>
            <li>
              Lintang orang pinter! I'm sure I would get a lot of useful feedback on existing features as well as suggestions for new ones. Improving the site will again lead to more users.
            </li>
            <li>
              I also need ideas for marketing. Mainly IG posts, possibly blog posts too. Then we see if we can use other platforms such as MeetUp, FaceBook, CouchSurfing, Nomad Table and others.
            </li>
            <li>
              Maintaining the promos without the venues updating them is a bit of work and I'm hoping for some help with that. I do have some other people I think I can ask for some free(ish) help with that too.
            </li>
          </ul>
        </section>

        {/* Future */}
        <section className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-neon-cyan mb-4">
            What's the future for Party Panther?
          </h2>
          <ul className="space-y-4 text-muted-foreground leading-relaxed list-disc list-outside pl-5">
            <li>
              As mentioned, increase the proportion of UGC. There are currently 100+ promos on the site (imported from Social Expat), but I worry that most of them are outdated. But it sure as hell is a start. There are also currently 63 venues. I have manually gone through most of them to make sure they are in the right category of area + subdistrict.
            </li>
            <li>Creating an app, implementing Nomad Table functionality and hopefully outgrow NT.</li>
            <li>When we are big enough, we can charge venues to highlight their promos/events. Also charge entrance fees directly in the app.</li>
            <li>
              Create Party Panther events, could be Social Expat style, could be Angkot Crawl, could be Pub Quiz, Speed Dating, Board game night, Halloween or other themes and much more. The sky is the limit.
            </li>
            <li>
              When we have a good enough reputation, we would obviously expand to Bali. After that, Singapore, Kuala Lumpur, Bangkok and Everywhere else.
            </li>
          </ul>
        </section>

        {/* Final words */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-neon-cyan mb-4">Final words</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Thanks for reading, Lintang! I wanted to put something proper together because I wanted to show you that A) I can actually be a business oriented person, and B) I would really like to have you on board and writing this proposal is worth the effort.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">Hope to hear from you soon!</p>
          <div className="text-muted-foreground leading-relaxed">
            <p>Best regards,</p>
            <p>Jørgen</p>
            <p className="text-neon-cyan">AKA Party Panther Papa</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Lintang;
