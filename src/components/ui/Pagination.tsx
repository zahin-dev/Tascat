import { PixelButton } from "./PixelButton";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label: string;
};

export function Pagination({ page, totalPages, onPageChange, label }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label={`${label}のページ`}> 
      <PixelButton
        variant="quiet"
        disabled={page <= 1}
        aria-label={page <= 1 ? "最初のページです" : "前のページ"}
        onClick={() => onPageChange(page - 1)}
      >
        前へ
      </PixelButton>
      <span className="pager-position" aria-current="page"><span aria-hidden="true">PAGE</span> {page} / {totalPages}</span>
      <PixelButton
        variant="quiet"
        disabled={page >= totalPages}
        aria-label={page >= totalPages ? "最後のページです" : "次のページ"}
        onClick={() => onPageChange(page + 1)}
      >
        次へ
      </PixelButton>
    </nav>
  );
}
