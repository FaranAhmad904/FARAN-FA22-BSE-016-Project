# Database Scripts

## approveExistingData.js

This script approves all existing restaurants and deals in the database that don't have a status or have a pending status.

### Usage

```bash
cd server
node scripts/approveExistingData.js
```

### What it does:

1. Sets all restaurants without a status field to 'approved'
2. Sets all restaurants with 'pending' status to 'approved'
3. Sets all deals without a status field to 'approved'
4. Sets all deals with 'pending' status to 'approved'

This is useful when migrating existing data to the new approval system.

