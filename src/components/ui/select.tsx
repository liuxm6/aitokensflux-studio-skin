/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
// Adapted from new-api's Base UI Select; no production hooks or stores.
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SelectRoot = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger(props: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      {...props}
      data-slot="select-trigger"
      className={cn("studio-select-trigger", props.className)}
    >
      <span className="studio-select-value">{props.children}</span>
      <SelectPrimitive.Icon className="studio-select-icon">
        <ChevronDown size={16} aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent(props: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side="bottom"
        align="start"
        sideOffset={6}
        alignItemWithTrigger={false}
        collisionPadding={12}
        className="studio-select-positioner"
      >
        <SelectPrimitive.Popup
          {...props}
          data-slot="select-content"
          className={cn("studio-select-popup", props.className)}
        >
          <SelectPrimitive.List className="studio-select-list">
            {props.children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectItem(props: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      {...props}
      data-slot="select-item"
      className={cn("studio-select-item", props.className)}
    >
      <SelectPrimitive.ItemText className="studio-select-item-text">
        {props.children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="studio-select-check">
        <Check size={16} aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export { SelectRoot, SelectValue, SelectTrigger, SelectContent, SelectItem };
