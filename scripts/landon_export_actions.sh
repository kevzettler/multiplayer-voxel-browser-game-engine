# this requires a blender file that was last saved in blender version 2.80^
# This depends on blender being installed on command line

#This is dependent on landon v0.3.6
# https://github.com/chinedufn/landon/commit/3812c4fd4f2ba8c085dbdc41aa9ce5f7594dd29e

# $ cargo install landon@0.3.6

# landon has 3 other dependencies that are manually managed
#
# Install blender mesh json exporter
# $ landon blender install mesh-to-json

# Install blender armature json addon
# $ landon blender install armature-to-json

# https://github.com/chinedufn/landon/issues/3#issuecomment-531479000
# $ npm install -g blender-iks-to-fks@2.0.0
# $ ik2fk --install

RUST_BACKTRACE=full landon blender export -f ./assets/WiP-punch.blend > landon_export &&
cat landon_export | sed -n '/START_ARMATURE_JSON/,/END_ARMATURE_JSON/{/START_ARMATURE_JSON/!{/END_ARMATURE_JSON/!p;};}' &&
    rm landon_export;
