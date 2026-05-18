import { Table } from "react-bootstrap";
const AppTable = ({
  columns = [],
  loading = false,
  loadingText = "Loading...",
  isEmpty = false,
  emptyText = "No data found.",
  responsive = true,
  children
}) => {
  const colCount = columns.length;
  return (
    <Table hover responsive={responsive} className="mb-0 align-middle">
      <thead className="bg-light text-muted small text-uppercase">
        <tr>
          {columns.map((col, i) => {
            if (typeof col === "string") {
              return <th key={i} className="py-3 px-4 border-0">{col}</th>;
            }
            const { label, ...rest } = col;
            return <th key={i} className="py-3 px-4 border-0" {...rest}>{label}</th>;
          })}
        </tr>
      </thead>
      <tbody>
        {loading
          ? <tr><td colSpan={colCount} className="text-center py-4 text-muted">{loadingText}</td></tr>
          : isEmpty
          ? <tr><td colSpan={colCount} className="text-center py-4 text-muted">{emptyText}</td></tr>
          : children}
      </tbody>
    </Table>
  );
};
export { AppTable };
