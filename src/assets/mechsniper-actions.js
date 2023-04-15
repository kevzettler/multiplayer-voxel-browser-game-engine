import { mat4 } from 'gl-matrix';
import mat4ToDualQuat from 'mat4-to-dual-quat';
import changeMat4CoordinateSystem from 'change-mat4-coordinate-system';

const mechSniperActions = require('./mechsniper-actions.json');
const zReflection = mat4.identity([]);
zReflection[0] = -1; //x
zReflection[10] = -1; //z

//
// Convert from landon format to skeletal-animation format
//
mechSniperActions.actions = Object.keys(mechSniperActions.actions)
      .reduce((allActions, actionName) => {
        allActions[actionName] = mechSniperActions.actions[actionName].reduce((keyframeMap, landonKeyFrameObject) => {
          keyframeMap[landonKeyFrameObject.frame_time_secs] = landonKeyFrameObject.bones.map((boneCollection) => boneCollection.Matrix);
          return keyframeMap;
        }, {});
        return allActions;
      }, {});

mechSniperActions.inverseBindPoses = mechSniperActions.inverse_bind_poses.map((ivp) => ivp.Matrix);
delete mechSniperActions.inverse_bind_poses;

mechSniperActions.jointNameIndices = mechSniperActions.joint_index;
delete mechSniperActions.joint_index;

//
// Convert from Blender to to dual quaternions
//
mechSniperActions.actions = Object.keys(mechSniperActions.actions)
// Iterate over each action so that we can process the keyframe times
  .reduce(function (allActions, actionName) {
    allActions[actionName] = Object.keys(mechSniperActions.actions[actionName])
    // Iterate over each keyframe time so that we can process the world bone space pose matrices
      .reduce(function (allKeyframes, keyframeTime) {
        allKeyframes[keyframeTime] = mechSniperActions.actions[actionName][keyframeTime]
        // Iterate over the matrices so that we can multiply them by inverse bind, and transpose
        // (transpose because they came from Blender which uses row major)
        // After fixing up our matrices we turn them into dual quaternions
          .map(function (matrix, index) {
            mat4.multiply(matrix, mechSniperActions.inverseBindPoses[index], matrix)
            mat4.transpose(matrix, matrix)
            matrix = changeMat4CoordinateSystem.rightToLeft(matrix);
            mat4.multiply(matrix, matrix, zReflection);
            mat4.multiply(matrix, zReflection, matrix);
            matrix = mat4ToDualQuat(matrix)
            return matrix
          })

        return allKeyframes
      }, {})

    return allActions
  }, {});

//Convert Blender JointNames to match Qubicle Chunk names Foot.R -> FootR
Object.keys(mechSniperActions.jointNameIndices).forEach((jointName) => {
  if(jointName.match(/\./)){
    var newName = jointName.replace('.', '');
    mechSniperActions.jointNameIndices[newName] = mechSniperActions.jointNameIndices[jointName];
    delete mechSniperActions.jointNameIndices[jointName]
  }
});

//Sekeltal animation system was crapping out when only one key frame
mechSniperActions.actions.pose['0.041667'] = mechSniperActions.actions.pose[0];

export default mechSniperActions;
