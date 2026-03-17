import Header from '../components/Header';

export default function Students() {
  return (
    <div>
      <Header />
      <main className="p-8">
        <h1 className="text-2xl font-bold">Students Page</h1>
        <p className="mt-2">Here you will manage students listings.</p>
      </main>
    </div>
  );
}