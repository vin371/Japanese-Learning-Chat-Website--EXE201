/* eslint-env browser */
import { Component } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../data/routes';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    const { hasError } = this.state;
    const { children, fallbackTitle } = this.props;

    if (!hasError) return children;

    return (
      <div className="app-fallback app-fallback--error" role="alert">
        <div className="app-fallback__card">
          <h1 className="app-fallback__title">{fallbackTitle || 'Không thể hiển thị trang'}</h1>
          <p className="app-fallback__text">
            Giao diện gặp lỗi không mong muốn. Bạn vẫn có thể quay về trang chủ hoặc thử tải lại.
          </p>
          <div className="app-fallback__actions">
            <button type="button" className="btn btn--primary" onClick={this.handleRetry}>
              Thử lại
            </button>
            <Link to={ROUTES.HOME} className="btn btn--ghost">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
