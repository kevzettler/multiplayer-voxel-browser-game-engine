RUST_BACKTRACE=1 landon blender export -f ./assets/WiP-punch.blend > landon_export &&
cat landon_export | sed -n '/START_ARMATURE_JSON/,/END_ARMATURE_JSON/{/START_ARMATURE_JSON/!{/END_ARMATURE_JSON/!p;};}' &&
    rm landon_export;
