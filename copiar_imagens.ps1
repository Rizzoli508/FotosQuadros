$src = 'C:\Users\joaov\FotosQuadros\geradas'
$dst = 'C:\Users\joaov\FotosQuadros\attached_assets'

$files = @(
  @('CASAL\CASAL1_pb.png',                  'casal_pb.png'),
  @('CASAL\CASAL1_color.png',               'casal_color.png'),
  @('MAEBB\MAEBB1_pb.png',                  'maebb1_pb.png'),
  @('MAEBB\MAEBB1_color.png',               'maebb1_color.png'),
  @('MAEBB\MAEBB2_pb.png',                  'maebb2_pb.png'),
  @('MAEBB\MAEBB2_color.png',               'maebb2_color.png'),
  @('MAEFILHA\MAEFILHA_CLASSICO_pb.png',    'maefilha_classico_pb.png'),
  @('MAEFILHA\MAEFILHA_CLASSICO_color.png', 'maefilha_classico_color.png'),
  @('MAEFILHA\MAEFILHA_INTIMO_pb.png',      'maefilha_intimo_pb.png'),
  @('MAEFILHA\MAEFILHA_INTIMO_color.png',   'maefilha_intimo_color.png'),
  @('PAIFILHA\PAIFILHA_CLASSICO_pb.png',    'paifilha_classico_pb.png'),
  @('PAIFILHA\PAIFILHA_CLASSICO_color.png', 'paifilha_classico_color.png'),
  @('PAIFILHA\PAIFILHA_INTIMO_pb.png',      'paifilha_intimo_pb.png'),
  @('PAIFILHA\PAIFILHA_INTIMO_color.png',   'paifilha_intimo_color.png'),
  @('MAEFILHO\MAEFILHO_CLASSICO_pb.png',    'maefilho_classico_pb.png'),
  @('MAEFILHO\MAEFILHO_CLASSICO_color.png', 'maefilho_classico_color.png'),
  @('MAEFILHO\MAEFILHO_INTIMO_pb.png',      'maefilho_intimo_pb.png'),
  @('MAEFILHO\MAEFILHO_INTIMO_color.png',   'maefilho_intimo_color.png'),
  @('PAIFILHO\PAIFILHO_CLASSICO_pb.png',    'paifilho_classico_pb.png'),
  @('PAIFILHO\PAIFILHO_CLASSICO_color.png', 'paifilho_classico_color.png'),
  @('PAIFILHO\PAIFILHO_INTIMO_pb.png',      'paifilho_intimo_pb.png'),
  @('PAIFILHO\PAIFILHO_INTIMO_color.png',   'paifilho_intimo_color.png'),
  @('FAMILIA3\FAMILIA3_ESTILO1_pb.png',     'familia3_e1_pb.png'),
  @('FAMILIA3\FAMILIA3_ESTILO1_color.png',  'familia3_e1_color.png'),
  @('FAMILIA3\FAMILIA3_ESTILO2_pb.png',     'familia3_e2_pb.png'),
  @('FAMILIA3\FAMILIA3_ESTILO2_color.png',  'familia3_e2_color.png'),
  @('FAMILIA3\FAMILIA3_ESTILO3_pb.png',     'familia3_e3_pb.png'),
  @('FAMILIA3\FAMILIA3_ESTILO3_color.png',  'familia3_e3_color.png'),
  @('FAMILIA3\FAMILIA3_ESTILO4_pb.png',     'familia3_e4_pb.png'),
  @('FAMILIA3\FAMILIA3_ESTILO4_color.png',  'familia3_e4_color.png'),
  @('FAMILIA4\FAMILIA4_ESTILO1_pb.png',     'familia4_e1_pb.png'),
  @('FAMILIA4\FAMILIA4_ESTILO1_color.png',  'familia4_e1_color.png'),
  @('FAMILIA4\FAMILIA4_ESTILO2_pb.png',     'familia4_e2_pb.png'),
  @('FAMILIA4\FAMILIA4_ESTILO2_color.png',  'familia4_e2_color.png'),
  @('FAMILIA4\FAMILIA4_ESTILO3_pb.png',     'familia4_e3_pb.png'),
  @('FAMILIA4\FAMILIA4_ESTILO3_color.png',  'familia4_e3_color.png'),
  @('FAMILIA4\FAMILIA4_ESTILO4_pb.png',     'familia4_e4_pb.png'),
  @('FAMILIA4\FAMILIA4_ESTILO4_color.png',  'familia4_e4_color.png'),
  @('1PESSOADOG\1PESSOADOG_pb.png',         'pet1_pb.png'),
  @('1PESSOADOG\1PESSOADOG_color.png',      'pet1_color.png'),
  @('FAMILIA2DOG\FAMILIA2DOG_pb.png',       'pet2_pb.png'),
  @('FAMILIA2DOG\FAMILIA2DOG_color.png',    'pet2_color.png'),
  @('FAMILIA3DOG\FAMILIA3DOG_pb.png',       'pet3_pb.png'),
  @('FAMILIA3DOG\FAMILIA3DOG_color.png',    'pet3_color.png')
)

foreach ($f in $files) {
  $from = Join-Path $src $f[0]
  $to   = Join-Path $dst $f[1]
  Copy-Item $from $to -Force
  Write-Host "OK: $($f[1])"
}
Write-Host 'Todos copiados!'
