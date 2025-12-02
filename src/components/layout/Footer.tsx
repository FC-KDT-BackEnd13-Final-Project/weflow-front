export function Footer() {
  return (
    <footer className="rounded-2xl border bg-white/80 px-6 py-4 text-sm text-muted-foreground flex flex-wrap items-center justify-between">
      <span>© 2025 weflow. All rights reserved.</span>
      <div className="flex gap-4">
        <a href="#" className="hover:text-foreground">개인정보처리방침</a>
        <a href="#" className="hover:text-foreground">이용약관</a>
      </div>
    </footer>
  );
}
