import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DemoNotice } from "@/components/primitives";
import { useDemoStore } from "@/demo/store";
import { SectionTabs } from "@/components/section-tabs";

export function AuthDialog(props: { onClose: () => void }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("Sign in");
  const navigate = useNavigate();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
      title={t(mode === "Sign in" ? "Welcome to your next workspace." : mode)}
      description={t("Authentication design preview. Do not enter real credentials.")}
      contentClassName="sm:max-w-md"
    >
      <SectionTabs
        label="Authentication preview"
        value={mode}
        onChange={setMode}
        options={["Sign in", "Register", "Recover access"]}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (mode === "Recover access")
              toast.success(t("Recovery preview complete. No email was sent."));
            else {
              useDemoStore.setState({ signedIn: true });
              void navigate({ to: "/$", params: { _splat: "console" } });
            }
            props.onClose();
          }}
        >
          <div className="field">
            <label htmlFor="demo-email">{t("Demo email")}</label>
            <Input
              id="demo-email"
              name="email"
              type="email"
              autoComplete="off"
              spellCheck={false}
              value="alex@example.test"
              readOnly
              aria-describedby="auth-example-hint"
            />
          </div>
          {mode !== "Recover access" && (
            <div className="field">
              <label htmlFor="demo-password">{t("Demo password")}</label>
              <Input
                id="demo-password"
                name="password"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value="not-a-real-password"
                readOnly
              />
            </div>
          )}
          <p id="auth-example-hint" className="text-xs text-muted-foreground mb-5">
            {t("These fixed example fields never leave this page.")}
          </p>
          <Button type="submit" className="w-full">
            {t(mode === "Recover access" ? "Preview recovery" : "Continue with demo account")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full mt-3"
            onClick={() =>
              toast.info(
                t(
                  "OAuth and step-up verification are preview-only. No identity provider was contacted.",
                ),
              )
            }
          >
            {t("Preview single sign-on")}
          </Button>
        </form>
      </SectionTabs>
      <div className="mt-5">
        <DemoNotice />
      </div>
    </Dialog>
  );
}
