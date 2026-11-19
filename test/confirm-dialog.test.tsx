// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog, confirmTitle } from "@/components/ConfirmDialog";

/**
 * Standard confirmation copy and button order (issue #407): the safe choice
 * comes first, the committing action last, and the committing button reports
 * progress without accepting a second press.
 */

afterEach(cleanup);

function setup(overrides: { busy?: boolean; danger?: boolean } = {}) {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  render(
    <ConfirmDialog
      open
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Cancel 2 subscriptions?"
      confirmLabel="Confirm cancellation"
      {...overrides}
    >
      <p>Both stop billing immediately.</p>
    </ConfirmDialog>,
  );
  return { onCancel, onConfirm };
}

describe("ConfirmDialog", () => {
  it("asks the question in the title", () => {
    setup();
    expect(
      screen.getByRole("dialog", { name: "Cancel 2 subscriptions?" }),
    ).toBeTruthy();
  });

  it("puts the safe choice first and the committing action last", () => {
    setup();
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Confirm cancellation" });
    // Document order is what a keyboard user tabs through.
    expect(
      cancel.compareDocumentPosition(confirm) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(confirm.className).toContain("btn-primary");
  });

  it("uses the danger colour for an irreversible action", () => {
    setup({ danger: true });
    expect(
      screen.getByRole("button", { name: "Confirm cancellation" }).className,
    ).toContain("btn-danger");
  });

  it("cancels without confirming", () => {
    const { onCancel, onConfirm } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("shows progress and refuses repeat confirmation while busy", () => {
    const { onConfirm } = setup({ busy: true });
    const button = screen.getByRole("button", { name: /Confirm cancellation/ });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(button);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("normalises a title into a question without doubling the mark", () => {
    expect(confirmTitle("Deactivate all plans")).toBe("Deactivate all plans?");
    expect(confirmTitle("Deactivate all plans?")).toBe("Deactivate all plans?");
    expect(confirmTitle("  ")).toBe("");
  });
});
