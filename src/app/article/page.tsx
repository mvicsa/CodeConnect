import { Card, CardContent } from "../../components/ui/card"
import Image from "next/image"

export default function BlogPost() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span>2 DAYS AGO</span>
            <span className="h-1 w-1 bg-muted-foreground rounded-full" />
            <span>5 MINS READ</span>
          </div>

          <h1 className="text-3xl font-bold leading-tight">
            Here’s the how and why did I became a full time Gaming Streamer
          </h1>

          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              26
            </div>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="cursor-pointer">🔗 Share!</span>
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center">F</div>
                <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center">T</div>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...
          </p>

          <p className="text-muted-foreground">
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium...
          </p>

          <div className="rounded overflow-hidden">
            <Image
              src="https://cdn.midjourney.com/0e9082c0-8774-4b0e-8423-1c739b211f1d/0_1.webp"
              alt="Elemental Witches Style"
              width={800}
              height={400}
              className="rounded"
            />
            <p className="text-center text-sm text-muted-foreground mt-2">
              Elemental Witches is the first game with which I started streaming
            </p>
          </div>

          <p className="text-muted-foreground">
            At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
