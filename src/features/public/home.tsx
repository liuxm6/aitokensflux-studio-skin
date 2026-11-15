import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ArrowRight,
  ArrowUp,
  Zap,
  Monitor,
  Layers3,
  ShieldCheck,
  Braces,
  Terminal,
  Wallet,
  Activity,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLink, TextLink, Select } from "@/components/primitives";
import { CopyButton } from "@/components/copy-button";
import { ProviderLogo } from "@/components/provider-logo";
import { models } from "@/demo/fixtures";
import { ModelCard } from "./model-card";

export function Home() {
  const { t } = useTranslation();
  return (
    <div className="home-page">
      <section className="hero container-wide">
        <div className="hero-copy">
          <span className="hero-badge">
            <Zap size={16} aria-hidden="true" />
            {t("One connection. Endless possibilities.")}
          </span>
          <h1>
            <Trans
              i18nKey="The right intelligence. For every idea."
              components={{
                lead: <span className="hero-title-lead" />,
                accent: <span className="hero-accent" />,
              }}
            />
          </h1>
          <p className="hero-description">
            {t(
              "Bring the best AI models into your workflow. One API, one workspace, and room for everything you want to build.",
            )}
          </p>
          <div className="hero-actions">
            <Button render={<AppLink to="/models" />} nativeButton={false}>
              {t("Explore models")}
              <ArrowRight size={17} aria-hidden="true" />
            </Button>
            <Button variant="outline" render={<AppLink to="/docs" />} nativeButton={false}>
              {t("View documentation")}
            </Button>
          </div>
        </div>
        <RequestPreview />
      </section>
      <div className="home-provider-band">
        <div className="container-wide provider-strip">
          <small>{t("Your favorite models, together")}</small>
          {["OpenAI", "Anthropic", "Google", "DeepSeek", "Mistral"].map((name) => (
            <span className="provider-word" key={name} translate="no">
              <ProviderLogo provider={name} className="provider-logo" />
              <span>{name}</span>
            </span>
          ))}
        </div>
      </div>
      <section className="section home-model-section">
        <div className="container-wide">
          <div className="section-heading">
            <div>
              <h2>{t("A model for every kind of work")}</h2>
              <p>{t("A considered selection. Start with what you need.")}</p>
            </div>
            <TextLink to="/models">{t("Browse all models")}</TextLink>
          </div>
          <div className="model-grid">
            {models.slice(0, 3).map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {t("Model details and prices shown here are demo examples, not current quotations.")}
          </p>
        </div>
      </section>
      <section className="section home-feature-section">
        <div className="container-wide">
          <div className="section-heading">
            <div>
              <h2>{t("Built for your workflow")}</h2>
              <p>{t("Everything you need to keep your next idea moving.")}</p>
            </div>
          </div>
          <div className="feature-grid">
            {[
              {
                icon: Layers3,
                title: "One place, more possibilities",
                desc: "Switch models without rebuilding your application. Keep your ideas moving.",
              },
              {
                icon: ShieldCheck,
                title: "A workspace that works together",
                desc: "Give your team the right access, with shared budgets and clear boundaries.",
              },
              {
                icon: Braces,
                title: "Less setup. More building.",
                desc: "Familiar APIs, readable examples and visibility into every request.",
              },
              {
                icon: Wallet,
                title: "Available credits",
                desc: "Keep your balance clear and your work uninterrupted.",
              },
              {
                icon: Activity,
                title: "Every request has a story",
                desc: "Understand what happened, without losing the bigger picture.",
              },
              { icon: Shield, title: "Privacy, by intention", desc: "Your data. Your choices." },
            ].map((feature) => (
              <article key={feature.title}>
                <span className="feature-icon">
                  <feature.icon aria-hidden="true" />
                </span>
                <h3>{t(feature.title)}</h3>
                <p>{t(feature.desc)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <div className="container-wide home-closing">
        <section className="cta-panel">
          <div>
            <h2>{t("Your next idea starts here.")}</h2>
            <p>{t("Make yourself at home in your new AI workspace.")}</p>
          </div>
          <Button render={<AppLink to="/console" />} nativeButton={false}>
            {t("Take a look inside")}
            <ArrowRight size={17} aria-hidden="true" />
          </Button>
        </section>
      </div>
    </div>
  );
}

function RequestPreview() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState("chat");
  const [model, setModel] = useState(models[0].id);
  const [prompt, setPrompt] = useState("");
  const [sent, setSent] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const panel = conversationRef.current;
    if (panel && sent) panel.scrollTop = panel.scrollHeight;
  }, [sent, mode, i18n.resolvedLanguage]);
  const code = `import OpenAI from 'openai';\n\nconst client = new OpenAI({\n  baseURL: 'https://api.example.test/v1',\n  apiKey: 'DEMO_NOT_A_REAL_KEY'\n});\n\nconst result = await client.chat.completions.create({\n  model: '${model}',\n  messages: [{ role: 'user', content: 'Hello!' }]\n});`;
  return (
    <div className="hero-preview">
      <div className="preview-head">
        <span className="assistant-avatar">
          <Monitor aria-hidden="true" />
        </span>
        <div className="preview-identity">
          <strong>{t("Ai Tokens Flux Assistant")}</strong>
          <small className="preview-status">
            <span aria-hidden="true" />
            {t("Interactive preview · no live requests")}
          </small>
        </div>
        <div className="preview-tools">
          <Select
            label="Choose a model"
            value={model}
            onChange={setModel}
            options={models.slice(0, 3).map((item) => ({ value: item.id, label: item.name }))}
            className="preview-model-select"
          />
          <div className="segmented">
            <Button
              variant="ghost"
              className={mode === "chat" ? "selected" : ""}
              onClick={() => setMode("chat")}
              aria-pressed={mode === "chat"}
            >
              {t("Chat")}
            </Button>
            <Button
              variant="ghost"
              className={mode === "code" ? "selected" : ""}
              onClick={() => setMode("code")}
              aria-label={t("Code")}
              aria-pressed={mode === "code"}
            >
              <Terminal size={15} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
      <div className="preview-body">
        {mode === "code" ? (
          <div className="preview-code">
            <div className="preview-code-toolbar">
              <span>request.js</span>
              <CopyButton
                value={code}
                size="sm"
                className="preview-copy"
                aria-label={t("Copy code")}
              >
                {t("Copy code")}
              </CopyButton>
            </div>
            <pre className="code-block" tabIndex={0} aria-label={t("Example request")}>
              {code}
            </pre>
          </div>
        ) : (
          <div
            className="preview-chat"
            ref={conversationRef}
            tabIndex={0}
            role="region"
            aria-label={t("Chat")}
          >
            <div className="preview-user">{sent || t("Help me bring my next idea to life.")}</div>
            <div className="preview-answer">
              <span className="assistant-avatar assistant-avatar-small">
                <Monitor size={17} aria-hidden="true" />
              </span>
              <div className="preview-assistant-bubble" aria-live="polite" aria-atomic="true">
                <p>
                  {sent
                    ? t(
                        "This is a simulated reply. Your message stays in this browser, and no AI model was called.",
                      )
                    : t(
                        "Of course. Start with a question, a sketch of an idea, or a problem worth solving. We can take it from there.",
                      )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <form
        className="preview-input"
        onSubmit={(event) => {
          event.preventDefault();
          if (prompt.trim()) {
            setSent(prompt.trim());
            setPrompt("");
            setMode("chat");
            inputRef.current?.focus();
          }
        }}
      >
        <Input
          ref={inputRef}
          aria-label={t("Your message")}
          aria-describedby="preview-composer-hint"
          enterKeyHint="send"
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229))
              event.preventDefault();
          }}
          placeholder={t("What would you like to explore?")}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          maxLength={500}
        />
        <Button
          className="icon-button"
          type="submit"
          disabled={!prompt.trim()}
          aria-label={t("Send demo message")}
        >
          <ArrowUp size={18} aria-hidden="true" />
        </Button>
      </form>
      <div className="preview-composer-meta" id="preview-composer-hint">
        <span>{t("Press Enter to send")}</span>
        <span
          className="preview-character-count"
          aria-label={t("Message length: {{count}} of {{limit}}", {
            count: prompt.length,
            limit: 500,
          })}
        >
          {prompt.length}/500
        </span>
      </div>
    </div>
  );
}
