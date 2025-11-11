const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const upload = multer({ dest: 'uploads/' });
const app = express();
app.use(cors());
app.use(express.json());

function runCmd(cmd, cwd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (err, stdout, stderr) => {
      if (err) return reject(stderr || err);
      resolve(stdout);
    });
  });
}

app.post('/api/scan-file', upload.single('contract'), async (req, res) => {
  try {
    const file = req.file;
    const dest = path.join(process.cwd(), 'uploads', file.originalname);
    fs.renameSync(file.path, dest);

    await runCmd(`solhint ${dest} --format json > ${dest}.solhint.json`);
    await runCmd(`slither ${dest} --json ${dest}.slither.json`);

    const solhintReport = fs.readFileSync(`${dest}.solhint.json`, 'utf8');
    const slitherReport = fs.readFileSync(`${dest}.slither.json`, 'utf8');

    res.json({
      success: true,
      message: "Scan completed successfully",
      reports: {
        solhint: JSON.parse(solhintReport),
        slither: JSON.parse(slitherReport),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.listen(5000, () => console.log('✅ Audit Express running at http://localhost:5000'));