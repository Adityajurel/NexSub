const User = require('../../models/User');
const { logAudit } = require('../../utils/auditLogger');

const getCustomers = async (req, res, next) => {
  try {
    const { search, active, page = 1, limit = 50 } = req.query;
    const filter = { role: 'Customer' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    if (active !== undefined) {
      filter.active = active === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ role: 'Staff' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      staff
    });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, companyName, phone, address, taxId, active } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const beforeState = user.toJSON();

    if (name) user.name = name;
    if (companyName !== undefined) user.companyName = companyName;
    if (phone !== undefined) user.phone = phone;
    if (address) user.address = { ...user.address, ...address };
    if (taxId !== undefined) user.taxId = taxId;
    if (active !== undefined) user.active = active;

    await user.save();

    await logAudit({
      actor: req.user,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: user._id,
      description: `User account updated: ${user.email}`,
      beforeState,
      afterState: user.toJSON(),
      req
    });

    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCustomers,
  getStaff,
  getUserById,
  updateUser
};
