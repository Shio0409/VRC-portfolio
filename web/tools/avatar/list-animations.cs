var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
var source = scene.GetRootGameObjects().Single(x => x.name == "Kipfel for portfolio");
var controllers = new HashSet<RuntimeAnimatorController>();
foreach (var component in source.GetComponentsInChildren<Component>(true)) {
  if (component == null) continue;
  var serialized = new SerializedObject(component);
  var property = serialized.GetIterator();
  while (property.Next(true)) if (property.propertyType == SerializedPropertyType.ObjectReference && property.objectReferenceValue is RuntimeAnimatorController)
    controllers.Add((RuntimeAnimatorController)property.objectReferenceValue);
}
var clips = new HashSet<AnimationClip>(controllers.SelectMany(c => c.animationClips));
foreach (var guid in AssetDatabase.FindAssets("t:AnimationClip", new [] { "Assets/MOCHIYAMA/Kipfel" }))
  foreach (var clip in AssetDatabase.LoadAllAssetsAtPath(AssetDatabase.GUIDToAssetPath(guid)).OfType<AnimationClip>()) clips.Add(clip);
var rows = clips.OrderBy(c => AssetDatabase.GetAssetPath(c)).ThenBy(c => c.name).Select(clip => new {
  name = clip.name, path = AssetDatabase.GetAssetPath(clip), duration = clip.length, humanoid = clip.isHumanMotion,
  bindings = AnimationUtility.GetCurveBindings(clip).Select(b => new { path=b.path, type=b.type.FullName, property=b.propertyName }).ToArray(),
  objectBindings = AnimationUtility.GetObjectReferenceCurveBindings(clip).Select(b => new { path=b.path, type=b.type.FullName, property=b.propertyName }).ToArray()
}).ToArray();
var output = System.IO.Path.GetFullPath(System.IO.Path.Combine(Application.dataPath, "../../web/.local/avatar/animation-catalog-source.json"));
System.IO.File.WriteAllText(output, Newtonsoft.Json.JsonConvert.SerializeObject(rows, Newtonsoft.Json.Formatting.Indented));
return new { output, count=rows.Length, controllers=controllers.Select(c=>AssetDatabase.GetAssetPath(c)).ToArray() };
