import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-brand-accent/10 bg-brand-dark/80 backdrop-blur-sm py-8 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-3">
        <p className="text-sm text-gray-400">
          عملتهولك عشان تفرك براحتك يا وحش — سكس ونيك وشرموطات على طول 🔥
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
          <Link href="/categories" className="hover:text-brand-accent">أقسام السكس</Link>
          <Link href="/pricing" className="hover:text-brand-accent">VIP</Link>
          <Link href="/auth/signin" className="hover:text-brand-accent">تعال اتشرمط</Link>
        </div>
        <p className="text-xs text-gray-600">© {new Date().getFullYear()} Aunt sex</p>
      </div>
    </footer>
  );
}
