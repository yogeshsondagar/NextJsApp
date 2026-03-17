import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-blue-600 text-white p-4">
      <nav className="flex space-x-4">
        <Link href="/" className="hover:underline">Home</Link>
        <Link href="/internships" className="hover:underline">Internships</Link>
        <Link href="/students" className="hover:underline">Students</Link>
        <Link href="/submissions" className="hover:underline">Submissions</Link>
      </nav>
    </header>
  );
}