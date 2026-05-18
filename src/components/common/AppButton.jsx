import { Button } from "react-bootstrap";
const AppButton = ({ children, ...props }) => {
  return <Button {...props}>{children}</Button>;
};
export { AppButton };
