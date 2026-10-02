import Link from "next/link";
import { buttonVariants, type ButtonStyleProps } from "./Button";

type Props = React.ComponentProps<typeof Link> & ButtonStyleProps;

// A next/link styled exactly like <Button>: for navigation that should look like an action.
export function ButtonLink({ variant, size, shape, fullWidth, className, ...props }: Props) {
  return (
    <Link className={buttonVariants({ variant, size, shape, fullWidth, className })} {...props} />
  );
}
