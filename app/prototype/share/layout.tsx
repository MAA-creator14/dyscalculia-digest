import { ProtoNav } from "./_shared";

export default function ShareProtoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtoNav />
      {children}
    </>
  );
}
