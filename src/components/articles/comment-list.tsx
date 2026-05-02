import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface CommentListProps {
  comments: Array<{
    id: string;
    content: string;
    createdAt: string | Date;
    author: {
      name: string;
      image?: string | null;
    };
  }>;
}

export function CommentList({ comments }: CommentListProps) {
  return (
    <section className="space-y-4" aria-label="التعليقات">
      <div>
        <h2 className="text-2xl font-bold">التعليقات</h2>
        <p className="text-muted-foreground text-sm">آراء القرّاء المنشورة.</p>
      </div>

      {comments.length ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar name={comment.author.name} src={comment.author.image} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{comment.author.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-7">
                {comment.content}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-muted-foreground p-6 text-center text-sm">
          لا توجد تعليقات منشورة.
        </Card>
      )}
    </section>
  );
}
