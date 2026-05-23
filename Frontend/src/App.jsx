export default function App() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">C# Backend + React Frontend</p>
        <h1>Project Csharp</h1>
        <p className="lead">
          Cấu trúc đã được tách đúng: backend là ASP.NET Core Web API, frontend là React chạy bằng Vite.
        </p>
      </section>

      <section className="card-grid">
        <article className="card">
          <h2>Backend</h2>
          <p>API nằm trong thư mục Backend, có Controllers, Models, Data để mở rộng dần.</p>
        </article>
        <article className="card">
          <h2>Frontend</h2>
          <p>React app nằm trong Frontend, có thể gọi API từ backend qua fetch hoặc axios.</p>
        </article>
        <article className="card">
          <h2>Next step</h2>
          <p>Thêm routing, form nhập liệu, và kết nối API thật cho đồ án.</p>
        </article>
      </section>
    </main>
  );
}