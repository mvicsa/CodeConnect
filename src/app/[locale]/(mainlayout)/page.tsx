import ClientCounter from "@/components/ClientCounter";
import { Calendar22 } from "@/components/DatePicker";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";
import Post from "@/components/Post";
import PostsList from "@/components/PostsList";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { PostType } from "@/types/post";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations();

  const post: PostType = {
    id: "1",
    text: "I came across this little piece of code and it made me stop and think... what exactly is the problem here? 🤔",
    code: `const items = [1, 2, 3];

for (var i = 0; i < items.length; i++) {
  setTimeout(() => {
    console.log('Item:', items[i]);
  }, 1000);
}
`,
    codeLang: "js",
    createdBy: "1",
    tags: ["javascript", "react", "nextjs", "typescript"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-center">
        <Logo />
      </div>
      <h1 className="text-2xl font-bold text-center mt-3">
        { t('title') }
      </h1>
      <p className="text-center mt-4">
        { t('description') }
      </p>
      <p className="text-center mt-2 mb-4">
        Share your code, learn from others. Join the community!
      </p>
      <div className="bg-warning text-warning-foreground px-3 py-1 rounded-2xl mt-2">Hello</div>
      <div className="bg-danger text-danger-foreground px-3 py-1 rounded-2xl mt-2">Hello</div>
      <div className="bg-info text-info-foreground px-3 py-1 rounded-2xl mt-2">Hello</div>
      <div className="bg-success text-success-foreground px-3 py-1 rounded-2xl mt-2">Hello</div>
      { /* Test Rediux Toolkit */ }
      <ClientCounter />
      <div className="flex justify-center gap-3 mt-6">
        <Heart fill="currentColor" />
        <Button>Button</Button>
        <Button variant="secondary">Button</Button>
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
      {/* <Post video="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" /> */}
      <div className="bg-muted p-4">
        Text
      </div>
      <Calendar22 />
      <PostsList />
    </div>
  );
}
