"use client";

import { useMemo } from "react";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import shellStyles from "@/app/shared/shell.module.css";
import type { SkillJsonSchema } from "@/lib/chat/types";
import { buildUiSchemaFromInputSchema, sanitizeJsonSchema } from "@/components/skill-form/schema-to-ui-schema";
import { AssetUploaderWidget } from "@/components/skill-form/widgets/AssetUploaderWidget";
import styles from "./skill-form.module.css";

const widgets = {
  asset_uploader: AssetUploaderWidget,
};

export function DynamicSkillForm({
  inputSchema,
  disabled,
  onSubmit,
}: {
  inputSchema: SkillJsonSchema;
  disabled?: boolean;
  onSubmit: (payload: unknown) => void;
}) {
  const schema = useMemo(() => sanitizeJsonSchema(inputSchema), [inputSchema]);
  const uiSchema = useMemo(() => buildUiSchemaFromInputSchema(inputSchema), [inputSchema]);

  return (
    <div className={styles.formWrap}>
      <Form
        schema={schema as Record<string, unknown>}
        uiSchema={uiSchema}
        validator={validator}
        widgets={widgets}
        disabled={disabled}
        showErrorList={false}
        noHtml5Validate
        onSubmit={({ formData }) => onSubmit(formData)}
      >
        <div className={styles.formActions}>
          <button
            type="submit"
            className={[shellStyles.button, shellStyles.buttonPrimary, styles.submitBtn].join(" ")}
            disabled={disabled}
          >
            {disabled ? "生成中…" : "生成分镜"}
          </button>
        </div>
      </Form>
    </div>
  );
}
