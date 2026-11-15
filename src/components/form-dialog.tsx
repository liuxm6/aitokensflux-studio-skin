import { useState, type HTMLAttributes } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Dialog } from "./dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { DemoNotice, Select } from "./primitives";

export type DemoField = {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "url";
  value?: string;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  spellCheck?: boolean;
  placeholder?: string;
  options?: (
    | string
    | { value: string; label: string; disabled?: boolean; localizeLabel?: boolean }
  )[];
  hint?: string;
  optional?: boolean;
};

export function FormDialog(props: {
  title: string;
  description?: string;
  fields: DemoField[];
  onClose: () => void;
  onSave: (values: Record<string, string>) => void | false;
  submitLabel?: string;
  disabled?: boolean;
  validate?: (values: Record<string, string>) => Record<string, string>;
}) {
  const { t } = useTranslation();
  const schema = z.record(z.string(), z.string()).superRefine((values, context) => {
    for (const field of props.fields) {
      const value = values[field.name]?.trim() ?? "";
      if (!value && !field.optional)
        context.addIssue({
          code: "custom",
          path: [field.name],
          message: "This field is required.",
        });
      if (value.length > 120)
        context.addIssue({
          code: "custom",
          path: [field.name],
          message: "Use 120 characters or fewer.",
        });
      if (field.type === "email" && value && !z.email().safeParse(value).success)
        context.addIssue({
          code: "custom",
          path: [field.name],
          message: "Enter a valid email address.",
        });
      if (
        field.type === "number" &&
        (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100000)
      )
        context.addIssue({
          code: "custom",
          path: [field.name],
          message: "Enter a number between 0 and 100,000.",
        });
      if (
        field.options &&
        value &&
        !field.options.some((option) =>
          typeof option === "string"
            ? option === value
            : option.value === value && !option.disabled,
        )
      ) {
        context.addIssue({ code: "custom", path: [field.name], message: "Select a valid option." });
      }
    }
    for (const [field, message] of Object.entries(props.validate?.(values) ?? {})) {
      context.addIssue({ code: "custom", path: [field], message });
    }
  });
  const form = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(props.fields.map((field) => [field.name, field.value ?? ""])),
  });
  const [discarding, setDiscarding] = useState(false);
  const isDirty = form.formState.isDirty;
  const requestClose = () => {
    if (isDirty) setDiscarding(true);
    else props.onClose();
  };
  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        title={t(props.title)}
        description={t(props.description ?? "Changes apply only to this design preview.")}
        contentClassName="sm:max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={requestClose}>
              {t("Cancel")}
            </Button>
            <Button type="submit" form="demo-edit-form" disabled={props.disabled}>
              {t(props.submitLabel ?? "Save changes")}
            </Button>
          </>
        }
      >
        <form
          id="demo-edit-form"
          onSubmit={form.handleSubmit((values) => {
            if (props.disabled) return;
            const trimmedValues = Object.fromEntries(
              Object.entries(values).map(([key, value]) => [key, value.trim()]),
            );
            const result = props.onSave(trimmedValues);
            if (result !== false) {
              form.reset(trimmedValues);
              props.onClose();
            }
          })}
          noValidate
        >
          {props.fields.map((field) => (
            <div className="field" key={field.name}>
              <label htmlFor={`field-${field.name}`}>{t(field.label)}</label>
              {field.options ? (
                <Controller
                  name={field.name}
                  control={form.control}
                  render={({ field: controlledField }) => (
                    <Select
                      id={`field-${field.name}`}
                      label={field.label}
                      name={controlledField.name}
                      value={controlledField.value}
                      onChange={controlledField.onChange}
                      onBlur={controlledField.onBlur}
                      triggerRef={controlledField.ref}
                      invalid={!!form.formState.errors[field.name]}
                      descriptionId={
                        [
                          field.hint ? `hint-${field.name}` : "",
                          form.formState.errors[field.name] ? `error-${field.name}` : "",
                        ]
                          .filter(Boolean)
                          .join(" ") || undefined
                      }
                      disabled={props.disabled}
                      options={(field.options ?? []).map((option) =>
                        typeof option === "string" ? { value: option, label: option } : option,
                      )}
                    />
                  )}
                />
              ) : (
                <Input
                  id={`field-${field.name}`}
                  type={field.type ?? "text"}
                  disabled={props.disabled}
                  placeholder={field.placeholder ? t(field.placeholder) : undefined}
                  autoComplete={
                    field.autoComplete ?? (field.type === "email" ? "email" : undefined)
                  }
                  inputMode={field.inputMode}
                  spellCheck={field.spellCheck ?? (field.type === "email" ? false : undefined)}
                  {...form.register(field.name)}
                  aria-invalid={!!form.formState.errors[field.name]}
                  aria-describedby={
                    [
                      field.hint ? `hint-${field.name}` : "",
                      form.formState.errors[field.name] ? `error-${field.name}` : "",
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                />
              )}
              {field.hint && <small id={`hint-${field.name}`}>{t(field.hint)}</small>}
              {form.formState.errors[field.name] && (
                <p className="field-error" role="alert" id={`error-${field.name}`}>
                  {t(String(form.formState.errors[field.name]?.message))}
                </p>
              )}
            </div>
          ))}
          <DemoNotice />
        </form>
      </Dialog>
      <ConfirmDialog
        open={discarding}
        onOpenChange={setDiscarding}
        title={t("Discard unsaved changes?")}
        desc={t("You have unsaved changes. Discard them?")}
        cancelBtnText={t("Keep editing")}
        confirmText={t("Discard changes")}
        handleConfirm={() => {
          form.reset();
          setDiscarding(false);
          props.onClose();
        }}
      />
    </>
  );
}
