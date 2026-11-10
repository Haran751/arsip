"use client";

import { Component, type ReactNode } from "react";
import Icon from "./icon";

type Props = {
  judul: string;
  children: ReactNode;
};

type State = { gagal: boolean };

/** Error boundary kecil untuk satu kartu/widget agar satu bagian gagal tidak merusak seluruh halaman. */
export default class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { gagal: false };

  static getDerivedStateFromError(): State {
    return { gagal: true };
  }

  componentDidCatch(error: unknown) {
    console.error(
      `[WIDGET] ${this.props.judul}:`,
      error instanceof Error ? error.message : String(error),
    );
  }

  render() {
    if (this.state.gagal) {
      return (
        <div className="widget-error" role="alert">
          <div>
            <strong>{this.props.judul}</strong>
            <p>Bagian ini gagal dimuat.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => this.setState({ gagal: false })}>
            <Icon name="check" size={14} /> Coba lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
