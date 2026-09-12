// Run with isuzu-unity-cli call execute_code --file <absolute path>.
// Requires UnityGLTF 2.14.1 and the project's installed NDMF. Output stays local.
if (EditorApplication.isPlayingOrWillChangePlaymode) throw new Exception("Exit Play Mode before exporting.");
var sourceScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
var source = sourceScene.GetRootGameObjects().Single(x => x.name == "Kipfel for portfolio");
var originalDirty = sourceScene.isDirty;
var output = System.IO.Path.GetFullPath(System.IO.Path.Combine(Application.dataPath, "../../web/.local/avatar"));
System.IO.Directory.CreateDirectory(output);
var filename = "kipfel-preview-" + DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");
var temporaryScene = UnityEditor.SceneManagement.EditorSceneManager.NewScene(UnityEditor.SceneManagement.NewSceneSetup.EmptyScene, UnityEditor.SceneManagement.NewSceneMode.Additive);
GameObject clone = null;
UnityGLTF.GLTFSettings settings = null;
var temporaryMaterials = new List<Material>();
try {
  clone = UnityEngine.Object.Instantiate(source);
  UnityEngine.SceneManagement.SceneManager.MoveGameObjectToScene(clone, temporaryScene);
  clone.name = "Kipfel for portfolio - web preview";
  if (PrefabUtility.IsPartOfPrefabInstance(clone)) PrefabUtility.UnpackPrefabInstance(clone, PrefabUnpackMode.Completely, InteractionMode.AutomatedAction);

  // Process clothing/mesh edits on the clone. A null asset root keeps generated assets in memory.
  var build = new nadena.dev.ndmf.BuildContext(clone, null);
  var flags = System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static;
  var phaseType = typeof(nadena.dev.ndmf.BuildPhase);
  var first = phaseType.GetProperty("First", flags).GetValue(null);
  var last = phaseType.GetProperty("Last", flags).GetValue(null);
  var process = typeof(nadena.dev.ndmf.AvatarProcessor).GetMethods(flags).Single(m => m.Name == "ProcessAvatar" && m.GetParameters().Length == 3 && m.GetParameters()[0].ParameterType == typeof(nadena.dev.ndmf.BuildContext));
  process.Invoke(null, new object[] { build, first, last });
  typeof(nadena.dev.ndmf.BuildContext).GetMethod("Finish", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic).Invoke(build, null);
  if (!build.Successful) throw new Exception("NDMF reported errors. Review its report before exporting.");
  clone.transform.position = Vector3.zero;
  clone.transform.rotation = Quaternion.identity;

  // PBR baseline only: lilToon lighting/outline/MatCap require a later Web shader pass.
  var standard = Shader.Find("Standard");
  if (standard == null) throw new Exception("Standard shader is unavailable.");
  var converted = new Dictionary<Material, Material>();
  var originals = new Dictionary<Material, Material>();
  foreach (var renderer in clone.GetComponentsInChildren<Renderer>(true)) {
    renderer.sharedMaterials = renderer.sharedMaterials.Select(original => {
      if (original == null) throw new Exception("Missing material on " + renderer.name);
      Material material;
      if (converted.TryGetValue(original, out material)) return material;
      material = new Material(standard) { name = original.name };
      temporaryMaterials.Add(material);
      if (original.HasProperty("_MainTex")) {
        material.SetTexture("_MainTex", original.GetTexture("_MainTex"));
        material.SetTextureScale("_MainTex", original.GetTextureScale("_MainTex"));
        material.SetTextureOffset("_MainTex", original.GetTextureOffset("_MainTex"));
      }
      if (original.HasProperty("_Color")) material.SetColor("_Color", original.GetColor("_Color"));
      material.SetFloat("_Metallic", 0);
      material.SetFloat("_Glossiness", 0);
      converted.Add(original, material);
      originals.Add(material, original);
      return material;
    }).ToArray();
  }
  settings = ScriptableObject.CreateInstance<UnityGLTF.GLTFSettings>();
  settings.ExportNames = true;
  settings.ExportAnimations = false;
  settings.ExportDisabledGameObjects = false;
  settings.UseMainCameraVisibility = false;
  settings.BakeSkinnedMeshes = false;
  settings.BlendShapeExportSparseAccessors = true;
  settings.BlendShapeExportProperties = UnityGLTF.GLTFSettings.BlendShapeExportPropertyFlags.PositionOnly | UnityGLTF.GLTFSettings.BlendShapeExportPropertyFlags.Normal;
  settings.TryExportTexturesFromDisk = true;
  settings.UseTextureFileTypeHeuristic = false;
  settings.UseCaching = false;
  var context = new UnityGLTF.ExportContext(settings);
  context.AfterMaterialExport = (exporter, root, material, node) => {
    var original = originals[material];
    node.DoubleSided = original.HasProperty("_Cull") && original.GetInt("_Cull") == 0;
    node.AlphaMode = original.renderQueue >= 3000 ? GLTF.Schema.AlphaMode.BLEND : original.renderQueue >= 2450 ? GLTF.Schema.AlphaMode.MASK : GLTF.Schema.AlphaMode.OPAQUE;
    if (node.AlphaMode == GLTF.Schema.AlphaMode.MASK && original.HasProperty("_Cutoff")) node.AlphaCutoff = original.GetFloat("_Cutoff");
  };
  new UnityGLTF.GLTFSceneExporter(clone.transform, context).SaveGLB(output, filename);
  var file = System.IO.Path.Combine(output, filename + ".glb");
  return new { file, bytes = new System.IO.FileInfo(file).Length, ndmfSuccessful = build.Successful, sourceScene = sourceScene.path, sourceDirtyBefore = originalDirty, sourceDirtyAfter = sourceScene.isDirty, materials = converted.Count };
} finally {
  if (clone != null) UnityEngine.Object.DestroyImmediate(clone);
  foreach (var material in temporaryMaterials) UnityEngine.Object.DestroyImmediate(material);
  if (settings != null) UnityEngine.Object.DestroyImmediate(settings);
  UnityEngine.SceneManagement.SceneManager.SetActiveScene(sourceScene);
  UnityEditor.SceneManagement.EditorSceneManager.CloseScene(temporaryScene, true);
}
