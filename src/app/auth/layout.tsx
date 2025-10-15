export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-darker via-gaming-dark to-gaming-darker">
      {children}
    </div>
  );
}