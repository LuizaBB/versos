import { Outlet, useNavigate } from "react-router-dom";

export function StackLayout() {
  const nav = useNavigate();
  return (
    <div className="stack-layout">
      <header className="stack-header">
        <button type="button" className="btn-back" onClick={() => nav(-1)} aria-label="Voltar">
          ← Voltar
        </button>
      </header>
      <div className="stack-body">
        <Outlet />
      </div>
    </div>
  );
}
