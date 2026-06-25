import { useEffect, useMemo, useState } from "react";

const NEW_ASSIGNEE_VALUE = "__new__";

type AssigneeOption = {
  id: string;
  name: string;
};

type AssigneeSelectProps = {
  assignees: AssigneeOption[];
  defaultValue?: string | null;
  inputClass: string;
};

function buildOptions(
  assignees: AssigneeOption[],
  currentName: string,
): AssigneeOption[] {
  const options = [...assignees];

  if (currentName && !options.some((assignee) => assignee.name === currentName)) {
    options.push({ id: `assigned-${currentName}`, name: currentName });
  }

  return options.sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function AssigneeSelect({
  assignees,
  defaultValue,
  inputClass,
}: AssigneeSelectProps) {
  const currentName = defaultValue?.trim() || "";
  const options = useMemo(
    () => buildOptions(assignees, currentName),
    [assignees, currentName],
  );
  const hasCurrentInList = options.some(
    (assignee) => assignee.name === currentName,
  );

  const [mode, setMode] = useState<"select" | "new">("select");
  const [selectedName, setSelectedName] = useState(
    hasCurrentInList ? currentName : "",
  );
  const [newName, setNewName] = useState("");

  // Sincronizar cuando el loader trae el responsable ya guardado
  useEffect(() => {
    if (currentName && hasCurrentInList) {
      setMode("select");
      setSelectedName(currentName);
      setNewName("");
      return;
    }

    if (!currentName) {
      setMode("select");
      setSelectedName("");
      setNewName("");
    }
  }, [currentName, hasCurrentInList]);

  const handleSelectChange = (value: string) => {
    if (value === NEW_ASSIGNEE_VALUE) {
      setMode("new");
      setNewName("");
      return;
    }

    setMode("select");
    setSelectedName(value);
  };

  return (
    <div className="space-y-3">
      <select
        id="assignee"
        autoComplete="off"
        value={mode === "new" ? NEW_ASSIGNEE_VALUE : selectedName}
        onChange={(event) => handleSelectChange(event.target.value)}
        className={inputClass}
      >
        <option value="">Sin asignar</option>
        {options.map((assignee) => (
          <option key={assignee.id} value={assignee.name}>
            {assignee.name}
          </option>
        ))}
        <option value={NEW_ASSIGNEE_VALUE}>+ Agregar nuevo responsable</option>
      </select>

      {mode === "new" ? (
        <div>
          <label htmlFor="assignee-new" className="text-xs text-muted-foreground">
            Nombre del nuevo responsable
          </label>
          <input
            id="assignee-new"
            name="assignee"
            type="text"
            autoComplete="off"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Ej. María García"
            className={inputClass}
            required
          />
        </div>
      ) : (
        <input type="hidden" name="assignee" value={selectedName} />
      )}
    </div>
  );
}
