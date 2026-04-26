; Local-scope captures for Ktav.
;
; Each compound object opens a scope; the key of a pair inside that
; scope is a "definition" (a property name local to that object).
; Editors / language servers can use these captures for outline views
; and rename-within-scope.

(source_file) @local.scope
(compound_object) @local.scope

(object_pair
  key: (key) @local.definition.property)
